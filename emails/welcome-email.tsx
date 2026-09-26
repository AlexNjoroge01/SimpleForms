import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "react-email"

// Email clients can't read CSS variables, so Design.md token values are inlined.
const c = { bg: "#E8F1E3", surface: "#FFFFFF", text: "#122119", muted: "#5C6B62", primary: "#067353" }

export default function WelcomeEmail({ name, appUrl }: { name?: string | null; appUrl: string }) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to SimpleForms — build your first form in a minute.</Preview>
      <Body style={{ backgroundColor: c.bg, fontFamily: "Manrope, Arial, sans-serif", padding: "32px 0" }}>
        <Container style={{ backgroundColor: c.surface, borderRadius: 24, padding: 32, maxWidth: 520 }}>
          <Heading style={{ color: c.text, fontSize: 24, fontWeight: 800, margin: 0 }}>
            Karibu{name ? `, ${name}` : ""}! 👋
          </Heading>
          <Text style={{ color: c.muted, fontSize: 16, lineHeight: 1.6 }}>
            Your SimpleForms account is ready. Start blank or from a Kenyan template, share it by link or
            QR code, and watch responses arrive.
          </Text>
          <Button
            href={`${appUrl}/dashboard`}
            style={{
              backgroundColor: c.text,
              color: "#FFFFFF",
              borderRadius: 999,
              padding: "14px 28px",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Create your first form
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
