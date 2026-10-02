import { Button, Heading, Text } from "react-email"

import { buttonStyle, c, EmailShell } from "@/emails/components/email-shell"

export type DailyDigestEmailProps = {
  name?: string | null
  forms: { title: string; count: number; url: string }[]
  dashboardUrl: string
  settingsUrl: string
}

export default function DailyDigestEmail({ name, forms, dashboardUrl, settingsUrl, appUrl }: DailyDigestEmailProps & { appUrl: string }) {
  const total = forms.reduce((n, f) => n + f.count, 0)
  const noun = total === 1 ? "response" : "responses"
  return (
    <EmailShell appUrl={appUrl} preview={`${total} new ${noun} in the last 24 hours`}>
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
      <Button href={dashboardUrl} style={{ ...buttonStyle, marginTop: 16 }}>
        Open dashboard
      </Button>
      <Text style={{ color: c.subtle, fontSize: 13, marginTop: 24 }}>
        Change how often we email you in{" "}
        <a href={settingsUrl} style={{ color: c.primary }}>
          settings
        </a>
        .
      </Text>
    </EmailShell>
  )
}
