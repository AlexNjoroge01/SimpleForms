import { z } from "zod"

import { LIMITS } from "@/lib/fields/registry"
import { FIELD_TYPES, type Field } from "@/lib/fields/types"

// Structural validation of Field objects (§6 shape). Used for draft autosave.
// Never let unvalidated fields reach the DB.

const id = z.string().regex(/^[a-z0-9]{1,32}$/i, "Invalid id")
const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const fieldConfigSchema = z
  .object({
    maxLength: z.number().int().min(1).max(LIMITS.longText).optional(),
    defaultCountry: z.literal("KE").optional(),
    min: z.number().finite().optional(),
    max: z.number().finite().optional(),
    currency: z.literal("KES").optional(),
    allowOther: z.boolean().optional(),
    minSelect: z.number().int().min(0).max(LIMITS.optionsMax).optional(),
    maxSelect: z.number().int().min(1).max(LIMITS.optionsMax).optional(),
    preset: z.literal("kenya_counties").optional(),
    minDate: isoDay.optional(),
    maxDate: isoDay.optional(),
    maxSizeMB: z.number().min(1).max(LIMITS.fileMaxMB).optional(),
    accept: z.enum(["image", "pdf", "any"]).optional(),
  })
  .strip()

export const fieldSchema = z.object({
  id,
  type: z.enum(FIELD_TYPES),
  label: z.string().max(LIMITS.labelMax),
  description: z.string().max(LIMITS.descriptionMax).optional(),
  placeholder: z.string().max(LIMITS.placeholderMax).optional(),
  required: z.boolean(),
  options: z
    .array(z.object({ id, label: z.string().max(LIMITS.optionMax) }))
    .max(LIMITS.optionsMax)
    .optional(),
  config: fieldConfigSchema.optional(),
}) satisfies z.ZodType<Field>

export const fieldsSchema = z
  .array(fieldSchema)
  .max(LIMITS.fieldsMax, `Forms can have at most ${LIMITS.fieldsMax} questions`)
  .refine((fs) => new Set(fs.map((f) => f.id)).size === fs.length, "Duplicate field ids")

/** What the builder autosaves. Empty labels are allowed in drafts; publish enforces them. */
export const draftSchema = z.object({
  title: z.string().trim().max(LIMITS.labelMax),
  description: z.string().max(2000).nullable(),
  fields: fieldsSchema,
})

export type Draft = z.infer<typeof draftSchema>
