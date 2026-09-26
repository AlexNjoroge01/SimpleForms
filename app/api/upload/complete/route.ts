import { and, eq, isNull } from "drizzle-orm"
import type { NextRequest } from "next/server"
import { z } from "zod"

import { uploads } from "@/db/schema"
import { db } from "@/lib/db"
import { isAllowedType } from "@/lib/fields/files"
import { verifyUploadToken } from "@/lib/server/upload-token"
import { baseUploadSchema, maxBytes, resolveUploadTarget } from "@/lib/server/uploads"
import { deleteObjects, files } from "@/lib/storage"

// Step 2 of a public upload: confirm the object really landed (and obeys the
// field's rules), then record an unclaimed Upload row. Its id is the answer;
// the submit route claims it, and the cleanup cron removes it if never used.

const schema = baseUploadSchema.extend({
  key: z.string().min(1).max(300),
  token: z.string().min(1).max(200),
  name: z.string().trim().min(1).max(200),
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Invalid upload request." }, { status: 400 })
  const { slug, fieldId, key, token, name } = parsed.data

  const target = await resolveUploadTarget(slug, fieldId)
  if (!target.ok) return target.response
  const { form, field } = target

  if (!key.startsWith(`forms/${form.id}/`) || !verifyUploadToken(token, form.id, field.id, key))
    return Response.json({ error: "This upload has expired. Please try again." }, { status: 403 })

  let stored: { size: number; type: string }
  try {
    stored = await files.head(key)
  } catch {
    return Response.json({ error: "We couldn’t find your file. Please upload it again." }, { status: 404 })
  }

  // Storage enforced these at upload time; re-check before trusting the object.
  if (stored.size > maxBytes(field) || !isAllowedType(field.config?.accept ?? "any", stored.type)) {
    await deleteObjects([key]).catch(() => {})
    return Response.json({ error: "That file isn’t allowed for this question." }, { status: 415 })
  }

  const [row] = await db
    .insert(uploads)
    .values({ formId: form.id, fieldId: field.id, key, contentType: stored.type, bytes: stored.size, originalName: name })
    .onConflictDoNothing({ target: uploads.key })
    .returning({ id: uploads.id })
  // Idempotent retry: reuse the existing unclaimed row for this key.
  const id =
    row?.id ??
    (
      await db
        .select({ id: uploads.id })
        .from(uploads)
        .where(and(eq(uploads.key, key), eq(uploads.formId, form.id), isNull(uploads.responseId)))
    )[0]?.id
  if (!id) return Response.json({ error: "This upload was already used." }, { status: 409 })

  return Response.json({ id, name, size: stored.size })
}
