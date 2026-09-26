import { and, desc, sql } from "drizzle-orm"
import type { NextRequest } from "next/server"

import { responses } from "@/db/schema"
import { apiUser } from "@/lib/auth"
import { CSV_BOM, csvCell, csvLine, exportFilename, guardCell, nairobiTimestamp } from "@/lib/csv"
import { db } from "@/lib/db"
import { appUrl } from "@/lib/env"
import type { Field } from "@/lib/fields/types"
import { getOwnedForm, responseFields } from "@/lib/forms"
import { parseFilters } from "@/lib/responses/filters"
import { responsesWhere } from "@/lib/responses/query"

// CSV export (Blueprint §11). Owner-only; streams in batches of 500.

const BATCH = 500

/** Fields that only exist in older snapshots, latest label first-seen order. */
async function legacyFields(formId: string, current: Field[]): Promise<Field[]> {
  const known = new Set(current.map((f) => f.id))
  const rows = await db.execute<{ field: Field }>(sql`
    select distinct on (f->>'id') f as field
    from ${responses} r, jsonb_array_elements(r.fields_snapshot) f
    where r.form_id = ${formId}
    order by f->>'id', r.created_at desc`)
  return rows.map((r) => r.field).filter((f) => f?.id && !known.has(f.id))
}

export async function GET(req: NextRequest, ctx: RouteContext<"/api/export/[formId]">) {
  const user = await apiUser()
  if (!user) return new Response("Sign in required.", { status: 401 })
  const { formId } = await ctx.params
  const form = await getOwnedForm(formId, user.id)
  if (!form) return new Response("Form not found.", { status: 404 })

  const filters = parseFilters(req.nextUrl.searchParams)
  const where = responsesWhere(form.id, filters)
  const current = responseFields(form)
  const columns = [...current, ...(await legacyFields(form.id, current))]
  const fileUrl = (id: string) => `${appUrl}/api/files/${id}`
  const encoder = new TextEncoder()

  // Keyset pagination over (created_at, id) so batches never skip or repeat rows.
  // The cursor keeps Postgres microsecond precision (JS Dates only have ms).
  let cursor: { ts: string; id: string } | null = null
  let headerSent = false

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        if (!headerSent) {
          headerSent = true
          const header = ["Submitted at", ...columns.map((f) => f.label || "Untitled question")].map((h) => guardCell(h))
          controller.enqueue(encoder.encode(CSV_BOM + csvLine(header)))
          return
        }
        const c = cursor
        const batch = await db
          .select({
            id: responses.id,
            createdAt: responses.createdAt,
            ts: sql<string>`${responses.createdAt}::text`,
            answers: responses.answers,
          })
          .from(responses)
          .where(c ? and(where, sql`(${responses.createdAt}, ${responses.id}) < (${c.ts}::timestamptz, ${c.id})`) : where)
          .orderBy(desc(responses.createdAt), desc(responses.id))
          .limit(BATCH)

        if (batch.length === 0) return controller.close()
        const last = batch[batch.length - 1]
        cursor = { ts: last.ts, id: last.id }

        let chunk = ""
        for (const r of batch) {
          chunk += csvLine([nairobiTimestamp(r.createdAt), ...columns.map((f) => csvCell(f, r.answers[f.id], fileUrl))])
        }
        controller.enqueue(encoder.encode(chunk))
        if (batch.length < BATCH) controller.close()
      } catch (err) {
        console.error("[export] failed", err)
        controller.error(err)
      }
    },
  })

  const filename = exportFilename(form.publishedTitle ?? form.title)
  return new Response(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
