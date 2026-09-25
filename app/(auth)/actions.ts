"use server"

import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { AuthError } from "next-auth"
import { after } from "next/server"

import { users } from "@/db/schema"
import { signIn } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email"
import { loginSchema, signupSchema } from "@/lib/validation/auth"

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
