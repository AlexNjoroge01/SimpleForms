import { and, eq, inArray, isNull, lt, or, sql } from "drizzle-orm"
import { after, type NextRequest } from "next/server"

import { forms, responses, uploads } from "@/db/schema"
import { db } from "@/lib/db"
import { buildZodSchema } from "@/lib/fields/build-zod-schema"
import type { Answers } from "@/lib/fields/types"
import { getPublicForm } from "@/lib/public-forms"
import { notifySubmission } from "@/lib/server/notify"
import { clientIp, hashIp } from "@/lib/server/ip"
import { LIMITS, rateLimit } from "@/lib/server/rate-limit"

// Submission pipeline (Blueprint §10). The server is the source of truth: the
// published fields are re-validated here no matter what the browser checked.

const MAX_BODY_BYTES = 256 * 1024

const json = (body: unknown, status = 200, headers?: HeadersInit) => Response.json(body, { status, headers })

class LimitReached extends Error {}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/submit/[slug]">) {
  const { slug } = await ctx.params

  const raw = await req.text()
  if (raw.length > MAX_BODY_BYTES) return json({ error: "Submission is too large." }, 413)
  let body: { answers?: unknown; _hp?: unknown }
  try {
    body = JSON.parse(raw)
  } catch {
    return json({ error: "Invalid request." }, 400)
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return json({ error: "Invalid request." }, 400)

  // 1. Form must be published and accepting responses.
  const form = await getPublicForm(slug)
  if (!form) return json({ error: "Form not found." }, 404)
  if (form.availability === "closed")
    return json({ error: "This form is no longer accepting responses.", state: "closed" }, 403)
  if (form.availability === "limit_reached")
    return json({ error: "This form has reached its response limit.", state: "limit_reached" }, 403)

  // 2. Honeypot: bots get a fake success and nothing is stored.
  if (typeof body._hp === "string" && body._hp.trim() !== "") return json({ ok: true })

  // 3. Rate limit by hashed IP + slug.
  const ipHash = hashIp(clientIp(req.headers))
  const rl = await rateLimit(`submit:${slug}:${ipHash}`, LIMITS.submit.limit, LIMITS.submit.windowSec)
  if (!rl.ok) {
    return json(
      { error: "Too many submissions from your connection. Please try again in a few minutes." },
      429,
      { "Retry-After": String(rl.retryAfterSec) }
    )
  }

  // 4–5. Validate + normalize against the published snapshot (unknown keys stripped).
  const answersIn = typeof body.answers === "object" && body.answers !== null ? body.answers : {}
  const parsed = buildZodSchema(form.fields).safeParse(answersIn)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "")
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message
    }
    return json({ error: "Please fix the highlighted answers.", fieldErrors }, 422)
  }
  const answers: Answers = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined)
  ) as Answers

  // 6. File answers must reference unclaimed uploads for this form + field.
  const fileAnswers = form.fields
    .filter((f) => f.type === "file_upload" && typeof answers[f.id] === "string")
    .map((f) => ({ fieldId: f.id, uploadId: answers[f.id] as string }))
  if (fileAnswers.length) {
    const rows = await db
      .select({ id: uploads.id, fieldId: uploads.fieldId })
      .from(uploads)
      .where(
        and(
          eq(uploads.formId, form.id),
          isNull(uploads.responseId),
          inArray(
            uploads.id,
            fileAnswers.map((a) => a.uploadId)
          )
        )
      )
    const fieldErrors: Record<string, string> = {}
    for (const a of fileAnswers) {
      if (!rows.some((r) => r.id === a.uploadId && r.fieldId === a.fieldId))
        fieldErrors[a.fieldId] = "This upload has expired. Please upload the file again."
    }
    if (Object.keys(fieldErrors).length) return json({ error: "Please re-upload your file.", fieldErrors }, 422)
  }

  // 7. One transaction: count (respecting the limit atomically), response, uploads.
  const limit = form.settings.responseLimit ?? null
  let responseId: string
  try {
    responseId = await db.transaction(async (tx) => {
      const [counted] = await tx
        .update(forms)
        .set({ responseCount: sql`${forms.responseCount} + 1`, updatedAt: sql`${forms.updatedAt}` })
        .where(and(eq(forms.id, form.id), limit ? lt(forms.responseCount, limit) : undefined))
        .returning({ id: forms.id })
      if (!counted) throw new LimitReached()

      const [row] = await tx
        .insert(responses)
        .values({
          formId: form.id,
          answers,
          fieldsSnapshot: form.fields,
          metadata: {
            userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? undefined,
            referrer: req.headers.get("referer")?.slice(0, 300) ?? undefined,
            ipHash,
          },
        })
        .returning({ id: responses.id })

      if (fileAnswers.length) {
        await tx
          .update(uploads)
          .set({ responseId: row.id })
          .where(
            and(
              eq(uploads.formId, form.id),
              isNull(uploads.responseId),
              or(...fileAnswers.map((a) => and(eq(uploads.id, a.uploadId), eq(uploads.fieldId, a.fieldId))))
            )
          )
      }
      return row.id
    })
  } catch (err) {
    if (err instanceof LimitReached)
      return json({ error: "This form has reached its response limit.", state: "limit_reached" }, 403)
    throw err
  }

  // 8. Notify the creator without delaying (or ever failing) the submission.
  after(() => notifySubmission(form.id, responseId).catch((err) => console.error("[notify] failed", err)))

  return json({ ok: true })
}
