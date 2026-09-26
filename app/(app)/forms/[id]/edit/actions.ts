"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { forms } from "@/db/schema"
import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { draftSchema, fieldsSchema } from "@/lib/fields/field-schema"
import { publishIssues, type PublishIssue } from "@/lib/fields/publish"
import { resolveSettings, settingsSchema } from "@/lib/fields/settings"
import type { FormSettings } from "@/lib/fields/types"
import { newSlug } from "@/lib/slug"

export type SaveResult = { ok: true; savedAt: string } | { ok: false; error: string }

const owned = (formId: string, userId: string) => and(eq(forms.id, formId), eq(forms.userId, userId))

/** Autosave target for the builder (§9.4). Saves the draft only — never the live form. */
export async function saveDraft(formId: string, input: unknown): Promise<SaveResult> {
  const user = await requireUser()
  const parsed = draftSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid form" }

  const { title, description, fields } = parsed.data
  const [row] = await db
    .update(forms)
    .set({ title: title || "Untitled form", description: description?.trim() || null, fields })
    .where(owned(formId, user.id))
    .returning({ updatedAt: forms.updatedAt })

  if (!row) return { ok: false, error: "Form not found." }
  revalidatePath("/dashboard")
  return { ok: true, savedAt: row.updatedAt.toISOString() }
}

export type PublishResult =
  | { ok: true; slug: string; status: "PUBLISHED" | "CLOSED" }
  | { ok: false; error: string; issues?: PublishIssue[] }

const MAX_SLUG_ATTEMPTS = 5

function isUniqueViolation(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } }
  return e?.code === "23505" || e?.cause?.code === "23505"
}

/**
 * Publish (§9.6): validate the saved draft, snapshot fields/title/description
 * into the published columns, and generate the slug on first publish.
 * A closed form stays closed — publishing only updates what it will show.
 */
export async function publishForm(formId: string): Promise<PublishResult> {
  const user = await requireUser()
  const form = await db.query.forms.findFirst({ where: owned(formId, user.id) })
  if (!form) return { ok: false, error: "Form not found." }

  const structural = fieldsSchema.safeParse(form.fields)
  if (!structural.success) return { ok: false, error: "This form has invalid questions. Try reloading the builder." }
  const issues = publishIssues(form.title, structural.data)
  if (issues.length) return { ok: false, error: "Fix these before publishing:", issues }

  const status = form.status === "CLOSED" ? "CLOSED" : "PUBLISHED"
  const snapshot = {
    status,
    publishedFields: structural.data,
    publishedTitle: form.title,
    publishedDescription: form.description,
    publishedAt: new Date(),
  } as const

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const slug = form.slug ?? newSlug()
    try {
      await db.update(forms).set({ ...snapshot, slug }).where(owned(formId, user.id))
      revalidatePath("/dashboard")
      revalidatePath(`/f/${slug}`)
      return { ok: true, slug, status }
    } catch (err) {
      if (!form.slug && isUniqueViolation(err)) continue // slug collision: try another
      throw err
    }
  }
  return { ok: false, error: "Couldn’t generate a link. Please try again." }
}

export type SettingsResult = { ok: true; settings: FormSettings } | { ok: false; error: string }

export async function saveSettings(formId: string, input: unknown): Promise<SettingsResult> {
  const user = await requireUser()
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid settings" }

  const settings = resolveSettings(parsed.data)
  const [row] = await db
    .update(forms)
    .set({ settings })
    .where(owned(formId, user.id))
    .returning({ slug: forms.slug })
  if (!row) return { ok: false, error: "Form not found." }
  if (row.slug) revalidatePath(`/f/${row.slug}`)
  return { ok: true, settings }
}
