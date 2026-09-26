import "server-only"

import { sql } from "drizzle-orm"

import { rateLimits } from "@/db/schema"
import { db } from "@/lib/db"

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSec: number }

/**
 * Fixed-window counter in Postgres (one atomic upsert per hit). Good enough for
 * MVP traffic without extra infrastructure (Blueprint §10.3).
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const window = sql.raw(`interval '${Math.floor(windowSec)} seconds'`)
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.windowStart} < now() - ${window} then 1 else ${rateLimits.count} + 1 end`,
        windowStart: sql`case when ${rateLimits.windowStart} < now() - ${window} then now() else ${rateLimits.windowStart} end`,
      },
    })
    .returning({
      count: rateLimits.count,
      resetIn: sql<number>`greatest(0, extract(epoch from (${rateLimits.windowStart} + ${window} - now())))::int`,
    })

  return { ok: row.count <= limit, remaining: Math.max(0, limit - row.count), retryAfterSec: row.resetIn }
}

export const LIMITS = {
  submit: { limit: 10, windowSec: 10 * 60 },
  uploadSign: { limit: 30, windowSec: 10 * 60 },
} as const
