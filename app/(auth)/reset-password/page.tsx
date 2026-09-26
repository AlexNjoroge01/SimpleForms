import type { Metadata } from "next"
import Link from "next/link"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"

// The token stays out of Referer headers sent from this page.
export const metadata: Metadata = { title: "Reset password", referrer: "no-referrer", robots: { index: false } }

// The link's token is only checked on submit (checking here would need a
// second lookup and still race with expiry); a bad link fails with a clear message.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[]; token?: string | string[] }>
}) {
  const { email, token } = await searchParams

  if (typeof email !== "string" || typeof token !== "string" || !email || !token) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="h3">This reset link is incomplete</h1>
        <p>Open the link from your email again, or request a new one.</p>
        <Link href="/forgot-password" className="font-semibold text-brand hover:underline">
          Send a new link
        </Link>
      </div>
    )
  }

  return <ResetPasswordForm email={email} token={token} />
}
