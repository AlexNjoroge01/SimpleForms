import { Button, Heading, Text } from "react-email"

import { buttonStyle, c, EmailShell } from "@/emails/components/email-shell"

export default function WelcomeEmail({ name, appUrl }: { name?: string | null; appUrl: string }) {
  return (
    <EmailShell appUrl={appUrl} preview="Welcome to SimpleForms — build your first form in a minute.">
      <Heading style={{ color: c.text, fontSize: 24, fontWeight: 800, margin: 0 }}>
        Karibu{name ? `, ${name}` : ""}! 👋
      </Heading>
      <Text style={{ color: c.muted, fontSize: 16, lineHeight: 1.6 }}>
        Your SimpleForms account is ready. Start blank or from a Kenyan template, share it by link or
        QR code, and watch responses arrive.
      </Text>
      <Button href={`${appUrl}/dashboard`} style={buttonStyle}>
        Create your first form
      </Button>
    </EmailShell>
  )
}
