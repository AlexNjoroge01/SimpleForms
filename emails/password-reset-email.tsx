import { Button, Heading, Text } from "react-email"

import { buttonStyle, c, EmailShell } from "@/emails/components/email-shell"

export type PasswordResetEmailProps = { name?: string | null; resetUrl: string; expiresInMin: number }

export default function PasswordResetEmail({ name, resetUrl, expiresInMin, appUrl }: PasswordResetEmailProps & { appUrl: string }) {
  return (
    <EmailShell appUrl={appUrl} preview="Reset your SimpleForms password">
      <Heading style={{ color: c.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Reset your password</Heading>
      <Text style={{ color: c.muted, fontSize: 16, lineHeight: 1.6 }}>
        Hi{name ? ` ${name}` : ""}, we got a request to reset your SimpleForms password. The link works once
        and expires in {expiresInMin} minutes.
      </Text>
      <Button href={resetUrl} style={buttonStyle}>
        Choose a new password
      </Button>
      <Text style={{ color: c.subtle, fontSize: 13, lineHeight: 1.5, marginTop: 24 }}>
        Didn’t ask for this? You can ignore this email — your password won’t change.
      </Text>
    </EmailShell>
  )
}
