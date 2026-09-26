import { and, count, eq, gte } from "drizzle-orm"

import { forms, responses, users } from "@/db/schema"
import { db } from "@/lib/db"
import { sendDailyDigestEmail } from "@/lib/email"
import { appUrl } from "@/lib/env"
import { isCronAuthorized, unauthorized } from "@/lib/server/cron"

// Daily 08:00 EAT (§14): per-form new response counts for the last 24h,
// sent to users who chose DAILY_DIGEST. Users with nothing new get no email.

export const maxDuration = 60

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return unauthorized()

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      formId: forms.id,
      title: forms.title,
      count: count(responses.id),
    })
    .from(responses)
    .innerJoin(forms, eq(forms.id, responses.formId))
    .innerJoin(users, eq(users.id, forms.userId))
    .where(and(eq(users.emailNotifications, "DAILY_DIGEST"), gte(responses.createdAt, since)))
    .groupBy(users.id, users.email, users.name, forms.id, forms.title)

  const byUser = new Map<string, { email: string; name: string | null; forms: { title: string; count: number; url: string }[] }>()
  for (const r of rows) {
    const entry = byUser.get(r.userId) ?? { email: r.email, name: r.name, forms: [] }
    entry.forms.push({ title: r.title, count: r.count, url: `${appUrl}/forms/${r.formId}/responses` })
    byUser.set(r.userId, entry)
  }

  for (const u of byUser.values()) {
    u.forms.sort((a, b) => b.count - a.count)
    await sendDailyDigestEmail(u.email, {
      name: u.name?.split(" ")[0],
      forms: u.forms,
      dashboardUrl: `${appUrl}/dashboard`,
      settingsUrl: `${appUrl}/settings`,
    })
  }

  return Response.json({ ok: true, emailed: byUser.size })
}
