import "server-only"

import type { ReactElement } from "react"
import { Resend } from "resend"

import DailyDigestEmail, { type DailyDigestEmailProps } from "@/emails/daily-digest-email"
import NewSubmissionEmail, { type NewSubmissionEmailProps } from "@/emails/new-submission-email"
import PasswordResetEmail, { type PasswordResetEmailProps } from "@/emails/password-reset-email"
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

export function sendPasswordResetEmail(to: string, props: PasswordResetEmailProps) {
  // With Resend mocked, print the link so the flow can be tested locally.
  if (!resend && process.env.NODE_ENV !== "production") console.info(`[email:mock] reset link: ${props.resetUrl}`)
  return send(to, "Reset your SimpleForms password", PasswordResetEmail({ ...props, appUrl }))
}

export function sendNewSubmissionEmail(to: string, props: NewSubmissionEmailProps) {
  return send(to, `New response: ${props.formTitle}`, NewSubmissionEmail({ ...props, appUrl }))
}

export function sendDailyDigestEmail(to: string, props: DailyDigestEmailProps) {
  const total = props.forms.reduce((n, f) => n + f.count, 0)
  return send(to, `${total} new ${total === 1 ? "response" : "responses"} today`, DailyDigestEmail({ ...props, appUrl }))
}
