import "server-only"

import { z } from "zod"

import { isConfigured } from "@/lib/env"
import { LIMITS } from "@/lib/fields/registry"
import type { Field } from "@/lib/fields/types"
import { getPublicForm, type PublicForm } from "@/lib/public-forms"

// Shared checks for the public upload routes.

export const uploadsEnabled = () => isConfigured("storage")

export const baseUploadSchema = z.object({
  slug: z.string().max(16),
  fieldId: z.string().max(32),
})

export function maxBytes(field: Field) {
  return Math.min(field.config?.maxSizeMB ?? LIMITS.fileDefaultMB, LIMITS.fileMaxMB) * 1024 * 1024
}

type Resolved = { ok: true; form: PublicForm; field: Field } | { ok: false; response: Response }

/** The open public form + its file field, or an error response. */
export async function resolveUploadTarget(slug: string, fieldId: string): Promise<Resolved> {
  const fail = (error: string, status: number) => ({ ok: false as const, response: Response.json({ error }, { status }) })
  if (!uploadsEnabled()) return fail("File uploads aren’t available right now.", 503)
  const form = await getPublicForm(slug)
  if (!form) return fail("Form not found.", 404)
  if (form.availability !== "open") return fail("This form is no longer accepting responses.", 403)
  const field = form.fields.find((f) => f.id === fieldId)
  if (!field || field.type !== "file_upload") return fail("This question doesn’t accept files.", 400)
  return { ok: true, form, field }
}
