import { Button, Heading, Section, Text } from "react-email"

import { buttonStyle, c, EmailShell } from "@/emails/components/email-shell"

export type NewSubmissionEmailProps = {
  formTitle: string
  responseCount: number
  answers: { label: string; value: string }[]
  viewUrl: string
  settingsUrl: string
}

export default function NewSubmissionEmail({
  formTitle,
  responseCount,
  answers,
  viewUrl,
  settingsUrl,
  appUrl,
}: NewSubmissionEmailProps & { appUrl: string }) {
  return (
    <EmailShell appUrl={appUrl} preview={`New response to ${formTitle}`}>
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
      <Button href={viewUrl} style={{ ...buttonStyle, marginTop: 16 }}>
        View response
      </Button>
      <Text style={{ color: c.subtle, fontSize: 13, marginTop: 24 }}>
        You get this email for every response. Change it in{" "}
        <a href={settingsUrl} style={{ color: c.primary }}>
          settings
        </a>
        .
      </Text>
    </EmailShell>
  )
}
