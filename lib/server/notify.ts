import "server-only"

import { eq } from "drizzle-orm"

import { forms, responses, users } from "@/db/schema"
import { db } from "@/lib/db"
import { sendNewSubmissionEmail } from "@/lib/email"
import { appUrl } from "@/lib/env"
import { formatAnswer } from "@/lib/fields/display"

const PREVIEW_ANSWERS = 4

/** Emails the form owner about a new response if they chose EACH_SUBMISSION (§10.8). */
export async function notifySubmission(formId: string, responseId: string) {
  const [row] = await db
    .select({
      email: users.email,
      pref: users.emailNotifications,
      title: forms.publishedTitle,
      responseCount: forms.responseCount,
    })
    .from(forms)
    .innerJoin(users, eq(users.id, forms.userId))
    .where(eq(forms.id, formId))
  if (!row || row.pref !== "EACH_SUBMISSION") return

  const response = await db.query.responses.findFirst({ where: eq(responses.id, responseId) })
  if (!response) return

  const answers = response.fieldsSnapshot
    .filter((f) => f.type !== "file_upload" && response.answers[f.id] !== undefined)
    .slice(0, PREVIEW_ANSWERS)
    .map((f) => ({ label: f.label, value: formatAnswer(f, response.answers[f.id]).slice(0, 300) }))

  await sendNewSubmissionEmail(row.email, {
    formTitle: row.title ?? "Your form",
    responseCount: row.responseCount,
    answers,
    viewUrl: `${appUrl}/forms/${formId}/responses?r=${responseId}`,
    settingsUrl: `${appUrl}/settings`,
  })
}
