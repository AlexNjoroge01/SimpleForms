import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { and, eq, gt } from "drizzle-orm"

import { verificationTokens } from "@/db/schema"
import { db } from "@/lib/db"

// Password reset tokens live in Auth.js's verification_tokens table under a
// namespaced identifier. Only a SHA-256 of the token is stored, so a DB leak
// can't be replayed; tokens are single-use and expire after an hour.

export const RESET_TTL_MIN = 60

const identifier = (email: string) => `password-reset:${email}`
const hash = (token: string) => createHash("sha256").update(token).digest("hex")

/** New token for this email (replacing any earlier one). Returns the raw token for the link. */
export async function createResetToken(email: string) {
  const token = randomBytes(32).toString("base64url")
  await db.transaction(async (tx) => {
    await tx.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier(email)))
    await tx.insert(verificationTokens).values({
      identifier: identifier(email),
      token: hash(token),
      expires: new Date(Date.now() + RESET_TTL_MIN * 60_000),
    })
  })
  return token
}

/** True for a valid, unexpired token, which is deleted in the same query (single use). */
export async function consumeResetToken(email: string, token: string) {
  const [row] = await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, identifier(email)),
        eq(verificationTokens.token, hash(token)),
        gt(verificationTokens.expires, new Date())
      )
    )
    .returning({ token: verificationTokens.token })
  return !!row
}
