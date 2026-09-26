"use server"

import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { AuthError } from "next-auth"
import { headers } from "next/headers"
import { after } from "next/server"

import { users } from "@/db/schema"
import { signIn } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email"
import { appUrl } from "@/lib/env"
import { clientIp, hashIp } from "@/lib/server/ip"
import { consumeResetToken, createResetToken, RESET_TTL_MIN } from "@/lib/server/password-reset"
import { LIMITS, rateLimit } from "@/lib/server/rate-limit"
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signupSchema } from "@/lib/validation/auth"

export type AuthActionResult = { error: string } | undefined

// Only allow same-site relative redirects.
function safeRedirect(to: unknown) {
  return typeof to === "string" && to.startsWith("/") && !to.startsWith("//") ? to : "/dashboard"
}

async function signInWithPassword(email: string, password: string, redirectTo: string) {
  try {
    await signIn("credentials", { email, password, redirectTo })
  } catch (err) {
    // signIn throws a redirect on success — only swallow real auth failures.
    if (err instanceof AuthError) return { error: "Incorrect email or password." }
    throw err
  }
}

export async function loginAction(input: unknown, callbackUrl?: string): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) return { error: "Enter a valid email and password." }
  return signInWithPassword(parsed.data.email, parsed.data.password, safeRedirect(callbackUrl))
}

export async function signupAction(input: unknown, callbackUrl?: string): Promise<AuthActionResult> {
  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." }
  const { name, email, password } = parsed.data

  const existing = await db.query.users.findFirst({ where: eq(users.email, email), columns: { id: true } })
  if (existing) return { error: "An account with this email already exists. Log in instead." }

  await db.insert(users).values({ name, email, passwordHash: await bcrypt.hash(password, 12) })
  after(() => sendWelcomeEmail({ to: email, name }))

  return signInWithPassword(email, password, safeRedirect(callbackUrl))
}

export async function googleSignInAction(callbackUrl?: string) {
  await signIn("google", { redirectTo: safeRedirect(callbackUrl) })
}

/**
 * Emails a reset link if the account exists. Always reports success so the
 * form can't be used to discover which emails have accounts.
 */
export async function requestPasswordResetAction(input: unknown): Promise<AuthActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) return { error: "Enter a valid email address." }
  const { email } = parsed.data

  const { limit, windowSec } = LIMITS.passwordReset
  const ip = hashIp(clientIp(await headers()))
  const [byIp, byEmail] = await Promise.all([
    rateLimit(`pwreset:ip:${ip}`, limit, windowSec),
    rateLimit(`pwreset:email:${email}`, limit, windowSec),
  ])
  if (!byIp.ok || !byEmail.ok) return { error: "Too many reset requests. Try again in an hour." }

  const user = await db.query.users.findFirst({ where: eq(users.email, email), columns: { name: true } })
  if (user) {
    const token = await createResetToken(email)
    const resetUrl = `${appUrl}/reset-password?${new URLSearchParams({ email, token })}`
    after(() => sendPasswordResetEmail(email, { name: user.name, resetUrl, expiresInMin: RESET_TTL_MIN }))
  }
}

/** Sets a new password from a valid reset link, then signs the user in. */
export async function resetPasswordAction(
  input: unknown,
  link: { email?: string; token?: string }
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your new password." }
  const email = link.email?.trim().toLowerCase()
  if (!email || !link.token) return { error: "This reset link is invalid. Request a new one." }

  if (!(await consumeResetToken(email, link.token))) {
    return { error: "This reset link is invalid or has expired. Request a new one." }
  }
  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(parsed.data.password, 12) })
    .where(eq(users.email, email))

  return signInWithPassword(email, parsed.data.password, "/dashboard")
}
