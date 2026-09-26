import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "react-email"

// Email clients can't read CSS variables, so Design.md token values are inlined.
const c = { bg: "#E8F1E3", surface: "#FFFFFF", text: "#122119", muted: "#5C6B62", subtle: "#8A958D", primary: "#067353", line: "#E3EAE3" }

export type DailyDigestEmailProps = {
  name?: string | null
  forms: { title: string; count: number; url: string }[]
  dashboardUrl: string
  settingsUrl: string
}

export default function DailyDigestEmail({ name, forms, dashboardUrl, settingsUrl }: DailyDigestEmailProps) {
  const total = forms.reduce((n, f) => n + f.count, 0)
  const noun = total === 1 ? "response" : "responses"
  return (
    <Html>
      <Head />
      <Preview>{`${total} new ${noun} in the last 24 hours`}</Preview>
      <Body style={{ backgroundColor: c.bg, fontFamily: "Manrope, Arial, sans-serif", padding: "32px 0" }}>
        <Container style={{ backgroundColor: c.surface, borderRadius: 24, padding: 32, maxWidth: 520 }}>
          <Text style={{ color: c.primary, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", margin: 0 }}>
            Daily digest
          </Text>
          <Heading style={{ color: c.text, fontSize: 22, fontWeight: 800, margin: "12px 0 8px" }}>
            {name ? `Habari ${name}, you` : "You"} got {total.toLocaleString("en-KE")} new {noun}
          </Heading>
          {forms.map((f, i) => (
            <div key={i} style={{ borderTop: `1px solid ${c.line}`, padding: "12px 0" }}>
              <a href={f.url} style={{ color: c.text, fontSize: 15, fontWeight: 700, textDecoration: "none" }}>
                {f.title}
              </a>
              <Text style={{ color: c.muted, fontSize: 14, margin: "4px 0 0" }}>
                {f.count.toLocaleString("en-KE")} new {f.count === 1 ? "response" : "responses"}
              </Text>
            </div>
          ))}
          <Button
            href={dashboardUrl}
            style={{ backgroundColor: c.text, color: "#FFFFFF", borderRadius: 999, padding: "14px 28px", fontWeight: 700, fontSize: 15, marginTop: 16 }}
          >
            Open dashboard
          </Button>
          <Text style={{ color: c.subtle, fontSize: 13, marginTop: 24 }}>
            Change how often we email you in{" "}
            <a href={settingsUrl} style={{ color: c.primary }}>
              settings
            </a>
            .
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
