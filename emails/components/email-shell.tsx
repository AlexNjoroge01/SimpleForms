import type { ReactNode } from "react"
import { Body, Column, Container, Head, Html, Img, Link, Preview, Row, Section, Text } from "react-email"

// Email clients can't read CSS variables, so Design.md token values are inlined.
export const c = {
  bg: "#E8F1E3",
  surface: "#FFFFFF",
  text: "#122119",
  muted: "#5C6B62",
  subtle: "#8A958D",
  primary: "#067353",
  line: "#E3EAE3",
}

// globals.css --bg-gradient and --progress. Clients without gradient support
// fall back to the solid colour.
const bgGradient = "linear-gradient(120deg, #E5F1D7 0%, #E8F1E3 50%, #DDECE4 100%)"
const accentGradient = "linear-gradient(90deg, #3AD691, #EAAA47)"

export const buttonStyle = {
  backgroundColor: c.text,
  color: "#FFFFFF",
  borderRadius: 999,
  padding: "14px 28px",
  fontWeight: 700,
  fontSize: 15,
}

/** Shared frame: favicon + wordmark, gradient page, card, footer. */
export function EmailShell({ appUrl, preview, children }: { appUrl: string; preview: string; children: ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: c.bg, backgroundImage: bgGradient, fontFamily: "Manrope, Arial, sans-serif", margin: 0, padding: "32px 12px" }}>
        <Container style={{ maxWidth: 520 }}>
          <Section style={{ padding: "0 4px 20px" }}>
            <Link href={appUrl} style={{ textDecoration: "none" }}>
              <Row style={{ width: "auto" }}>
                <Column style={{ width: 32, verticalAlign: "middle" }}>
                  <Img src={`${appUrl}/email-logo.png`} width={32} height={32} alt="" style={{ borderRadius: 10, display: "block" }} />
                </Column>
                <Column style={{ verticalAlign: "middle", paddingLeft: 8 }}>
                  <Text style={{ color: c.text, fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>SimpleForms</Text>
                </Column>
              </Row>
            </Link>
          </Section>

          <Section style={{ backgroundColor: c.surface, borderRadius: 24, boxShadow: "0 20px 50px rgba(18, 33, 25, 0.08)" }}>
            <div style={{ height: 4, margin: "0 32px", borderRadius: "0 0 4px 4px", backgroundColor: "#3AD691", backgroundImage: accentGradient }} />
            <div style={{ padding: 32 }}>{children}</div>
          </Section>

          <Text style={{ color: c.subtle, fontSize: 12, textAlign: "center", margin: "24px 0 0" }}>
            Sent by{" "}
            <Link href={appUrl} style={{ color: c.primary, fontWeight: 700 }}>
              SimpleForms
            </Link>{" "}
            · Beautiful forms for Kenya
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
