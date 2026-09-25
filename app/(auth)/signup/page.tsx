import { Suspense } from "react"
import type { Metadata } from "next"

import { AuthForm } from "@/components/auth/auth-form"
import { googleEnabled } from "@/lib/auth"

export const metadata: Metadata = { title: "Sign up" }

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" googleEnabled={googleEnabled} />
    </Suspense>
  )
}
