import { z } from "zod"

import { FIELD_REGISTRY } from "@/lib/fields/registry"
import type { AnswerValue, Field } from "@/lib/fields/types"

// Blueprint §6: Field[] → Zod object schema for answers. Used by the public form
// (React Hook Form resolver) AND the submit route — the server always re-validates.

function isEmpty(v: unknown) {
  return (
    v === undefined ||
    v === null ||
    (typeof v === "string" && v.trim() === "") ||
    (Array.isArray(v) && v.length === 0)
  )
}

export function buildFieldSchema(field: Field): z.ZodType<AnswerValue | undefined> {
  const answer = FIELD_REGISTRY[field.type].answerSchema(field)

  return z.unknown().transform((value, ctx) => {
    if (isEmpty(value)) {
      if (field.required) {
        ctx.addIssue({ code: "custom", message: "This field is required" })
        return z.NEVER
      }
      return undefined
    }
    const result = answer.safeParse(value)
    if (!result.success) {
      for (const issue of result.error.issues) ctx.addIssue({ code: "custom", message: issue.message })
      return z.NEVER
    }
    return result.data
  })
}

/** Unknown keys (e.g. fields removed since the page loaded, honeypots) are stripped. */
export function buildZodSchema(fields: Field[]) {
  return z.object(Object.fromEntries(fields.map((f) => [f.id, buildFieldSchema(f)])))
}
