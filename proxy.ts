import NextAuth from "next-auth"

import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig)

// Next 16 "proxy" (formerly middleware): redirects signed-out users away from
// app routes and signed-in users away from /login and /signup.
export default auth

export const config = {
  matcher: ["/dashboard/:path*", "/forms/:path*", "/settings/:path*", "/login", "/signup"],
}
