import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "react-email"

// Email clients can't read CSS variables, so Design.md token values are inlined.
const c = { bg: "#E8F1E3", surface: "#FFFFFF", text: "#122119", muted: "#5C6B62", subtle: "#8A958D", primary: "#067353", line: "#E3EAE3" }

export type NewSubmissionEmailProps = {
  formTitle: string
  responseCount: number
  answers: { label: string; value: string }[]
  viewUrl: string
  settingsUrl: string
}

export default function NewSubmissionEmail({ formTitle, responseCount, answers, viewUrl, settingsUrl }: NewSubmissionEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`New response to ${formTitle}`}</Preview>
      <Body style={{ backgroundColor: c.bg, fontFamily: "Manrope, Arial, sans-serif", padding: "32px 0" }}>
        <Container style={{ backgroundColor: c.surface, borderRadius: 24, padding: 32, maxWidth: 520 }}>
          <Text style={{ color: c.primary, fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", margin: 0 }}>
            New response · #{responseCount.toLocaleString("en-KE")}
          </Text>
          <Heading style={{ color: c.text, fontSize: 22, fontWeight: 800, margin: "12px 0 16px" }}>{formTitle}</Heading>
          <Section>
            {answers.map((a, i) => (
              <div key={i} style={{ borderTop: `1px solid ${c.line}`, padding: "12px 0" }}>
                <Text style={{ color: c.muted, fontSize: 13, margin: 0 }}>{a.label}</Text>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: 600, margin: "4px 0 0" }}>{a.value}</Text>
              </div>
            ))}
          </Section>
          <Button
            href={viewUrl}
            style={{ backgroundColor: c.text, color: "#FFFFFF", borderRadius: 999, padding: "14px 28px", fontWeight: 700, fontSize: 15, marginTop: 16 }}
          >
            View response
          </Button>
          <Text style={{ color: c.subtle, fontSize: 13, marginTop: 24 }}>
            You get this email for every response. Change it in{" "}
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
