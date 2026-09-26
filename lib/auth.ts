import "server-only"

import { DrizzleAdapter } from "@auth/drizzle-adapter"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { notFound, redirect } from "next/navigation"

import { authConfig } from "@/auth.config"
import { accounts, sessions, users, verificationTokens } from "@/db/schema"
import { db } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email"
import { env, isConfigured } from "@/lib/env"
import { loginSchema } from "@/lib/validation/auth"

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"]
  }
}

export const googleEnabled = isConfigured("google")

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    ...(googleEnabled
      ? [Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET })]
      : []),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw)
        if (!parsed.success) return null
        const user = await db.query.users.findFirst({
          where: eq(users.email, parsed.data.email),
        })
        // Google-only accounts have no password hash.
        if (!user?.passwordHash) return null
        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash)
        return ok ? { id: user.id, name: user.name, email: user.email, image: user.image } : null
      },
    }),
  ],
  events: {
    // Fires for OAuth sign-ups; credentials sign-ups send from the signup action.
    async createUser({ user }) {
      if (user.email) await sendWelcomeEmail({ to: user.email, name: user.name })
    },
  },
})

/** Current user or redirect to /login. Use in every authed page/action. */
export async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  return session.user
}

/** Whether this account can open /admin. Read from the DB so revoking takes effect immediately. */
export async function isAdmin(userId: string) {
  const row = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { isAdmin: true } })
  return row?.isAdmin ?? false
}

/** Current admin, or 404 for everyone else (don't advertise that /admin exists). */
export async function requireAdmin() {
  const user = await requireUser()
  if (!(await isAdmin(user.id))) notFound()
  return user
}

/** Current user or null — for route handlers, which answer 401 instead of redirecting. */
export async function apiUser() {
  const session = await auth()
  return session?.user?.id ? session.user : null
}
