import "server-only"

import { and, desc, eq } from "drizzle-orm"
import { notFound } from "next/navigation"

import { forms } from "@/db/schema"
import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"

// Every form read goes through here so the owner check (Blueprint §12) is never skipped.

export async function listMyForms() {
  const user = await requireUser()
  return db
    .select({
      id: forms.id,
      title: forms.title,
      status: forms.status,
      responseCount: forms.responseCount,
      updatedAt: forms.updatedAt,
    })
    .from(forms)
    .where(eq(forms.userId, user.id))
    .orderBy(desc(forms.updatedAt))
}

/** The form if the signed-in user owns it; otherwise 404 (don't leak existence). */
export async function getMyFormOr404(formId: string) {
  const user = await requireUser()
  const form = await db.query.forms.findFirst({
    where: and(eq(forms.id, formId), eq(forms.userId, user.id)),
  })
  if (!form) notFound()
  return form
}

export type FormListItem = Awaited<ReturnType<typeof listMyForms>>[number]
