import "server-only"

import type { ReactElement } from "react"
import { Resend } from "resend"

import WelcomeEmail from "@/emails/welcome-email"
import { appUrl, env, isConfigured } from "@/lib/env"

const resend = isConfigured("resend") ? new Resend(env.RESEND_API_KEY) : null

/** Sends an email; never throws (failures are logged). Logs instead when Resend is mocked. */
async function send(to: string, subject: string, react: ReactElement) {
  if (!resend) {
    console.info(`[email:mock] to=${to} subject="${subject}"`)
    return
  }
  try {
    const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, react })
    if (error) console.error("[email] send failed", error)
  } catch (err) {
    console.error("[email] send failed", err)
  }
}

export function sendWelcomeEmail({ to, name }: { to: string; name?: string | null }) {
  return send(to, "Welcome to SimpleForms", WelcomeEmail({ name, appUrl }))
}
