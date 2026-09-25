import type { NextAuthConfig } from "next-auth"

// Edge-light auth config shared by proxy.ts and lib/auth.ts (no DB imports here).
export const APP_PREFIXES = ["/dashboard", "/forms", "/settings"]
const AUTH_PAGES = ["/login", "/signup"]

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    // Optimistic cookie-only check (Blueprint §12). Pages re-verify on the server.
    authorized({ auth, request: { nextUrl } }) {
      const signedIn = !!auth?.user
      const path = nextUrl.pathname
      if (APP_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return signedIn
      if (signedIn && AUTH_PAGES.includes(path)) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }
      return true
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id
      return token
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
  },
} satisfies NextAuthConfig
