import "server-only"

import { timingSafeEqual } from "node:crypto"

import { env } from "@/lib/env"

/** Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` (§14). */
export function isCronAuthorized(req: Request) {
  const given = Buffer.from(req.headers.get("authorization") ?? "")
  const expected = Buffer.from(`Bearer ${env.CRON_SECRET}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export const unauthorized = () => Response.json({ error: "Unauthorized" }, { status: 401 })
