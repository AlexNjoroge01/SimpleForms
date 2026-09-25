"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { forms } from "@/db/schema"
import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { draftSchema } from "@/lib/fields/field-schema"

export type SaveResult = { ok: true; savedAt: string } | { ok: false; error: string }

/** Autosave target for the builder (§9.4). Saves the draft only — never the live form. */
export async function saveDraft(formId: string, input: unknown): Promise<SaveResult> {
  const user = await requireUser()
  const parsed = draftSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid form" }

  const { title, description, fields } = parsed.data
  const [row] = await db
    .update(forms)
    .set({ title: title || "Untitled form", description: description?.trim() || null, fields })
    .where(and(eq(forms.id, formId), eq(forms.userId, user.id)))
    .returning({ updatedAt: forms.updatedAt })

  if (!row) return { ok: false, error: "Form not found." }
  revalidatePath("/dashboard")
  return { ok: true, savedAt: row.updatedAt.toISOString() }
}
