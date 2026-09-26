import "server-only"

import { eq } from "drizzle-orm"

import { forms } from "@/db/schema"
import { db } from "@/lib/db"
import { formAvailability, resolveSettings } from "@/lib/fields/settings"
import { isValidSlug } from "@/lib/slug"

// Public (no-auth) reads by slug. Only published data leaves this module —
// the editable draft never reaches the public page.

export async function getPublicForm(slug: string) {
  if (!isValidSlug(slug)) return null
  const form = await db.query.forms.findFirst({
    where: eq(forms.slug, slug),
    columns: {
      id: true,
      userId: true,
      slug: true,
      status: true,
      publishedTitle: true,
      publishedDescription: true,
      publishedFields: true,
      settings: true,
      responseCount: true,
    },
  })
  if (!form || !form.publishedFields || form.status === "DRAFT") return null

  const settings = resolveSettings(form.settings)
  return {
    id: form.id,
    userId: form.userId,
    slug: slug,
    title: form.publishedTitle ?? "Untitled form",
    description: form.publishedDescription,
    fields: form.publishedFields,
    settings,
    responseCount: form.responseCount,
    availability: formAvailability(form, settings),
  }
}

export type PublicForm = NonNullable<Awaited<ReturnType<typeof getPublicForm>>>
