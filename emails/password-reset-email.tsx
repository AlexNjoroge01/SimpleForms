import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "react-email"

// Email clients can't read CSS variables, so Design.md token values are inlined.
const c = { bg: "#E8F1E3", surface: "#FFFFFF", text: "#122119", muted: "#5C6B62", subtle: "#8A958D" }

export type PasswordResetEmailProps = { name?: string | null; resetUrl: string; expiresInMin: number }

export default function PasswordResetEmail({ name, resetUrl, expiresInMin }: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your SimpleForms password</Preview>
      <Body style={{ backgroundColor: c.bg, fontFamily: "Manrope, Arial, sans-serif", padding: "32px 0" }}>
        <Container style={{ backgroundColor: c.surface, borderRadius: 24, padding: 32, maxWidth: 520 }}>
          <Heading style={{ color: c.text, fontSize: 24, fontWeight: 800, margin: 0 }}>Reset your password</Heading>
          <Text style={{ color: c.muted, fontSize: 16, lineHeight: 1.6 }}>
            Hi{name ? ` ${name}` : ""}, we got a request to reset your SimpleForms password. The link works once
            and expires in {expiresInMin} minutes.
          </Text>
          <Button
            href={resetUrl}
            style={{
              backgroundColor: c.text,
              color: "#FFFFFF",
              borderRadius: 999,
              padding: "14px 28px",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Choose a new password
          </Button>
          <Text style={{ color: c.subtle, fontSize: 13, lineHeight: 1.5, marginTop: 24 }}>
            Didn’t ask for this? You can ignore this email — your password won’t change.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
