import "server-only"

import { and, count, desc, eq, gte, inArray, lt, or, sql, type SQL } from "drizzle-orm"

import { responses, uploads } from "@/db/schema"
import { db } from "@/lib/db"
import type { ResponseFilters } from "@/lib/responses/filters"

// Response queries (§9.8). Callers must have checked form ownership.

export const PAGE_SIZE = 25

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)

/** Start of a Nairobi calendar day as an absolute instant. */
const nairobiDayStart = (day: string) => new Date(`${day}T00:00:00+03:00`)

export function responsesWhere(formId: string, f: ResponseFilters): SQL {
  const conds: (SQL | undefined)[] = [eq(responses.formId, formId)]
  // "Full-text-ish" search: ILIKE over the answers JSON (§9.8, fine for MVP).
  if (f.q) conds.push(sql`${responses.answers}::text ilike ${`%${escapeLike(f.q)}%`}`)
  if (f.from) conds.push(gte(responses.createdAt, nairobiDayStart(f.from)))
  if (f.to) {
    const end = nairobiDayStart(f.to)
    end.setUTCDate(end.getUTCDate() + 1)
    conds.push(lt(responses.createdAt, end))
  }
  // Choice filter: single value equals, or multi-select array contains.
  if (f.field && f.value) {
    const answer = sql`${responses.answers} -> ${f.field}`
    conds.push(or(sql`${answer} = to_jsonb(${f.value}::text)`, sql`${answer} @> jsonb_build_array(${f.value}::text)`))
  }
  return and(...conds)!
}

export async function listResponses(formId: string, f: ResponseFilters, page: number) {
  const where = responsesWhere(formId, f)
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ id: responses.id, createdAt: responses.createdAt, answers: responses.answers })
      .from(responses)
      .where(where)
      .orderBy(desc(responses.createdAt), desc(responses.id))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(responses).where(where),
  ])
  return { rows, total }
}

export async function getResponse(formId: string, responseId: string) {
  const response = await db.query.responses.findFirst({
    where: and(eq(responses.formId, formId), eq(responses.id, responseId)),
  })
  if (!response) return null
  const files = await db
    .select({ id: uploads.id, fieldId: uploads.fieldId, originalName: uploads.originalName, contentType: uploads.contentType, bytes: uploads.bytes })
    .from(uploads)
    .where(and(eq(uploads.formId, formId), eq(uploads.responseId, responseId)))
  return { ...response, files }
}

export async function uploadKeysForResponses(formId: string, ids: string[]) {
  if (!ids.length) return []
  return db
    .select({ key: uploads.key })
    .from(uploads)
    .where(and(eq(uploads.formId, formId), inArray(uploads.responseId, ids)))
}
