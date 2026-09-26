import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"

import { env } from "@/lib/env"

// Binds a signed storage key to the form + field it was issued for, so the
// "complete" step can't be pointed at someone else's object (§10 file uploads).

const TTL_SEC = 15 * 60

const sign = (payload: string) => createHmac("sha256", env.AUTH_SECRET).update(`upload:${payload}`).digest("base64url")

export function issueUploadToken(formId: string, fieldId: string, key: string, now = Date.now()) {
  const exp = Math.floor(now / 1000) + TTL_SEC
  return `${exp}.${sign(`${formId}:${fieldId}:${key}:${exp}`)}`
}

export function verifyUploadToken(token: string, formId: string, fieldId: string, key: string, now = Date.now()) {
  const [expStr, sig] = token.split(".")
  const exp = Number(expStr)
  if (!sig || !Number.isInteger(exp) || exp < Math.floor(now / 1000)) return false
  const expected = Buffer.from(sign(`${formId}:${fieldId}:${key}:${exp}`))
  const given = Buffer.from(sig)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
