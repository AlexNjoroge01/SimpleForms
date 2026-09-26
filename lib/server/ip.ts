import "server-only"

import { createHash } from "node:crypto"

import { env } from "@/lib/env"

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}

/** Salted hash — raw IPs are never stored (Blueprint §19). */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`${env.IP_HASH_SALT}:${ip}`).digest("hex").slice(0, 32)
}
