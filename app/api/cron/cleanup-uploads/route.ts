import { and, inArray, isNull, lt, sql } from "drizzle-orm"

import { forms, uploads } from "@/db/schema"
import { db } from "@/lib/db"
import { isCronAuthorized, unauthorized } from "@/lib/server/cron"
import { deleteObjects } from "@/lib/storage"

// Daily 02:00 EAT (§14): delete orphaned uploads (never attached to a
// response) older than 24h, and close forms whose closeAt has passed.

const BATCH = 500
const MAX_BATCHES = 20

export const maxDuration = 60

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return unauthorized()

  let deletedUploads = 0
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  for (let i = 0; i < MAX_BATCHES; i++) {
    const orphans = await db
      .select({ id: uploads.id, key: uploads.key })
      .from(uploads)
      .where(and(isNull(uploads.responseId), lt(uploads.createdAt, cutoff)))
      .limit(BATCH)
    if (!orphans.length) break
    // Objects first: if storage fails, rows stay and the next run retries.
    await deleteObjects(orphans.map((o) => o.key))
    await db.delete(uploads).where(
      and(
        isNull(uploads.responseId),
        inArray(
          uploads.id,
          orphans.map((o) => o.id)
        )
      )
    )
    deletedUploads += orphans.length
    if (orphans.length < BATCH) break
  }

  const closed = await db
    .update(forms)
    .set({ status: "CLOSED" })
    .where(
      and(
        sql`${forms.status} = 'PUBLISHED'`,
        sql`nullif(${forms.settings}->>'closeAt', '') is not null`,
        sql`(${forms.settings}->>'closeAt')::timestamptz <= now()`
      )
    )
    .returning({ id: forms.id })

  return Response.json({ ok: true, deletedUploads, closedForms: closed.length })
}
