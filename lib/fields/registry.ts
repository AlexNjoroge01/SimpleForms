import {
  RiAtLine,
  RiCalendarLine,
  RiCheckboxMultipleLine,
  RiFileUploadLine,
  RiHashtag,
  RiListCheck,
  RiMapPinLine,
  RiPhoneLine,
  RiRadioButtonLine,
  RiText,
  RiTextBlock,
  RiToggleLine,
  type RemixiconComponentType,
} from "@remixicon/react"
import { z } from "zod"

import { newId } from "@/lib/ids"
import { KENYA_COUNTIES } from "@/lib/kenya/counties"
import { normalizeKenyanPhone } from "@/lib/kenya/phone"
import type { AnswerValue, Field, FieldOption, FieldType } from "@/lib/fields/types"

/**
 * The single field registry (Blueprint §3). Builder, public renderer, submission
 * validator and CSV exporter all read from here.
 * UI renderers live in components/ and are keyed by the same `FieldType`.
 */

export type FieldGroup = "text" | "choice" | "other"

export type FieldDefinition = {
  type: FieldType
  label: string
  hint: string
  icon: RemixiconComponentType
  /** Types in the same group can be switched between without losing data. */
  group: FieldGroup
  supportsPlaceholder: boolean
  supportsOptions: boolean
  defaults: () => Omit<Field, "id" | "type" | "required">
  /** Schema for a *present* (non-empty) answer. Output is the normalized value. */
  answerSchema: (field: Field) => z.ZodType<AnswerValue>
  /** Serializes a stored answer for CSV export (§11). */
  toCsv: (value: AnswerValue) => string
}

export const LIMITS = {
  shortText: 255,
  longText: 5000,
  labelMax: 200,
  descriptionMax: 500,
  placeholderMax: 200,
  optionMax: 200,
  optionsMax: 200,
  fieldsMax: 100,
  fileMaxMB: 10,
  fileDefaultMB: 5,
} as const

export const options = (...labels: string[]): FieldOption[] =>
  labels.map((label) => ({ id: newId(), label }))

/** Choice labels a dropdown/radio/checkbox accepts (preset-aware). */
export function choiceLabels(field: Field): string[] {
  if (field.type === "dropdown" && field.config?.preset === "kenya_counties") return [...KENYA_COUNTIES]
  return (field.options ?? []).map((o) => o.label)
}

const text = (max: number) => z.string().trim().max(max, `Keep it under ${max.toLocaleString()} characters`)

const isoDate = /^\d{4}-\d{2}-\d{2}$/
function isRealDate(s: string) {
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(s)
}

/** "KES 1,500.50" / "1 500" / 1500 → 1500.5; NaN when not numeric. */
export function parseNumber(v: unknown): number {
  if (typeof v === "number") return v
  if (typeof v !== "string") return Number.NaN
  const cleaned = v.replace(/kes/i, "").replace(/[\s,]/g, "")
  return cleaned === "" ? Number.NaN : Number(cleaned)
}

const joinCsv = (v: AnswerValue) => (v === null || v === undefined ? "" : String(v))

export const FIELD_REGISTRY: Record<FieldType, FieldDefinition> = {
  short_text: {
    type: "short_text",
    label: "Short text",
    hint: "Names, titles, one-line answers",
    icon: RiText,
    group: "text",
    supportsPlaceholder: true,
    supportsOptions: false,
    defaults: () => ({ label: "Short answer", placeholder: "Your answer" }),
    answerSchema: (f) => text(Math.min(f.config?.maxLength ?? LIMITS.shortText, LIMITS.shortText)),
    toCsv: joinCsv,
  },
  long_text: {
    type: "long_text",
    label: "Long text",
    hint: "Comments, descriptions, feedback",
    icon: RiTextBlock,
    group: "text",
    supportsPlaceholder: true,
    supportsOptions: false,
    defaults: () => ({ label: "Long answer", placeholder: "Type your answer here…" }),
    answerSchema: (f) => text(Math.min(f.config?.maxLength ?? LIMITS.longText, LIMITS.longText)),
    toCsv: joinCsv,
  },
  email: {
    type: "email",
    label: "Email",
    hint: "Validated email address",
    icon: RiAtLine,
    group: "text",
    supportsPlaceholder: true,
    supportsOptions: false,
    defaults: () => ({ label: "Email address", placeholder: "john@example.co.ke" }),
    answerSchema: () =>
      z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email address")),
    toCsv: joinCsv,
  },
  phone: {
    type: "phone",
    label: "Phone",
    hint: "Kenyan mobile, +254",
    icon: RiPhoneLine,
    group: "text",
    supportsPlaceholder: true,
    supportsOptions: false,
    defaults: () => ({ label: "Phone number", placeholder: "712 345 678", config: { defaultCountry: "KE" } }),
    answerSchema: () =>
      z.string().transform((v, ctx) => {
        const e164 = normalizeKenyanPhone(v)
        if (!e164) {
          ctx.addIssue({ code: "custom", message: "Enter a valid Kenyan mobile number, e.g. 0712 345 678" })
          return z.NEVER
        }
        return e164
      }),
    toCsv: joinCsv,
  },
  number: {
    type: "number",
    label: "Number",
    hint: "Quantities, amounts in KES",
    icon: RiHashtag,
    group: "text",
    supportsPlaceholder: true,
    supportsOptions: false,
    defaults: () => ({ label: "Number", placeholder: "0" }),
    answerSchema: (f) =>
      z.union([z.number(), z.string()]).transform((v, ctx) => {
        const n = parseNumber(v)
        const { min, max } = f.config ?? {}
        if (!Number.isFinite(n)) ctx.addIssue({ code: "custom", message: "Enter a number" })
        else if (min !== undefined && n < min) ctx.addIssue({ code: "custom", message: `Must be at least ${min.toLocaleString()}` })
        else if (max !== undefined && n > max) ctx.addIssue({ code: "custom", message: `Must be at most ${max.toLocaleString()}` })
        else return n
        return z.NEVER
      }),
    toCsv: joinCsv, // raw number, no currency formatting (§8)
  },
  single_choice: {
    type: "single_choice",
    label: "Single choice",
    hint: "Pick one option",
    icon: RiRadioButtonLine,
    group: "choice",
    supportsPlaceholder: false,
    supportsOptions: true,
    defaults: () => ({ label: "Choose one", options: options("Option 1", "Option 2") }),
    answerSchema: (f) => {
      const labels = choiceLabels(f)
      return text(LIMITS.optionMax).refine(
        (v) => labels.includes(v) || (!!f.config?.allowOther && v.length > 0),
        "Choose one of the options"
      )
    },
    toCsv: joinCsv,
  },
  multiple_choice: {
    type: "multiple_choice",
    label: "Multiple choice",
    hint: "Pick several options",
    icon: RiCheckboxMultipleLine,
    group: "choice",
    supportsPlaceholder: false,
    supportsOptions: true,
    defaults: () => ({ label: "Choose all that apply", options: options("Option 1", "Option 2", "Option 3") }),
    answerSchema: (f) => {
      const labels = choiceLabels(f)
      const { minSelect, maxSelect, allowOther } = f.config ?? {}
      return z
        .array(text(LIMITS.optionMax).min(1))
        .refine((vs) => new Set(vs).size === vs.length, "Each option can only be chosen once")
        .refine(
          (vs) => vs.every((v) => labels.includes(v)) || (!!allowOther && vs.filter((v) => !labels.includes(v)).length <= 1),
          "Choose from the options"
        )
        .refine((vs) => minSelect === undefined || vs.length >= minSelect, `Choose at least ${minSelect}`)
        .refine((vs) => maxSelect === undefined || vs.length <= maxSelect, `Choose at most ${maxSelect}`)
    },
    toCsv: (v) => (Array.isArray(v) ? v.join("; ") : joinCsv(v)),
  },
  dropdown: {
    type: "dropdown",
    label: "Dropdown",
    hint: "Pick one from a list",
    icon: RiListCheck,
    group: "choice",
    supportsPlaceholder: true,
    supportsOptions: true,
    defaults: () => ({ label: "Select an option", placeholder: "Select…", options: options("Option 1", "Option 2") }),
    answerSchema: (f) => {
      const labels = choiceLabels(f)
      return text(LIMITS.optionMax).refine((v) => labels.includes(v), "Choose one of the options")
    },
    toCsv: joinCsv,
  },
  date: {
    type: "date",
    label: "Date",
    hint: "Calendar date",
    icon: RiCalendarLine,
    group: "other",
    supportsPlaceholder: false,
    supportsOptions: false,
    defaults: () => ({ label: "Date" }),
    answerSchema: (f) => {
      const { minDate, maxDate } = f.config ?? {}
      return z
        .string()
        .trim()
        .refine((v) => isoDate.test(v) && isRealDate(v), "Enter a valid date")
        .refine((v) => !minDate || v >= minDate, `Date must be on or after ${minDate}`)
        .refine((v) => !maxDate || v <= maxDate, `Date must be on or before ${maxDate}`)
    },
    toCsv: joinCsv, // already YYYY-MM-DD
  },
  yes_no: {
    type: "yes_no",
    label: "Yes / No",
    hint: "Two big buttons",
    icon: RiToggleLine,
    group: "other",
    supportsPlaceholder: false,
    supportsOptions: false,
    defaults: () => ({ label: "Yes or no?" }),
    answerSchema: () => z.enum(["yes", "no"], "Choose yes or no"),
    toCsv: (v) => (v === "yes" ? "Yes" : v === "no" ? "No" : ""),
  },
  file_upload: {
    type: "file_upload",
    label: "File upload",
    hint: "Images, PDFs, documents",
    icon: RiFileUploadLine,
    group: "other",
    supportsPlaceholder: false,
    supportsOptions: false,
    defaults: () => ({ label: "Upload a file", config: { maxSizeMB: LIMITS.fileDefaultMB, accept: "any" } }),
    // The answer is an Upload row id; ownership is verified by the submit route (§10.6).
    answerSchema: () => z.string().trim().min(1).max(64),
    toCsv: joinCsv, // exporter swaps upload ids for download URLs
  },
}

export const FIELD_DEFINITIONS = Object.values(FIELD_REGISTRY)

/** Picker entries: every type, plus the "Kenyan county" shortcut (§6). */
export const PICKER_ITEMS: { key: string; type: FieldType; label: string; hint: string; icon: RemixiconComponentType; preset?: "kenya_counties" }[] = [
  ...FIELD_DEFINITIONS.map((d) => ({ key: d.type, type: d.type, label: d.label, hint: d.hint, icon: d.icon })),
  { key: "kenya_county", type: "dropdown", label: "Kenyan county", hint: "All 47 counties", icon: RiMapPinLine, preset: "kenya_counties" },
]

export function createField(type: FieldType, preset?: "kenya_counties"): Field {
  const base: Field = { id: newId(), type, required: false, ...FIELD_REGISTRY[type].defaults() }
  if (preset === "kenya_counties") {
    return { ...base, label: "County", placeholder: "Select your county", options: undefined, config: { preset } }
  }
  return base
}

/** Types a field can switch to without losing its core data. */
export function compatibleTypes(type: FieldType): FieldType[] {
  const group = FIELD_REGISTRY[type].group
  return group === "other" ? [type] : FIELD_DEFINITIONS.filter((d) => d.group === group).map((d) => d.type)
}

/** Switch type, keeping id/label/description/required (+ placeholder/options where supported). */
export function changeFieldType(field: Field, type: FieldType): Field {
  if (field.type === type) return field
  const def = FIELD_REGISTRY[type]
  const defaults = def.defaults()
  const keepOptions = def.supportsOptions && field.options?.length
  const allowOther = def.group === "choice" && type !== "dropdown" ? field.config?.allowOther : undefined
  return {
    id: field.id,
    type,
    label: field.label,
    description: field.description,
    required: field.required,
    placeholder: def.supportsPlaceholder ? (field.placeholder ?? defaults.placeholder) : undefined,
    options: def.supportsOptions ? (keepOptions ? field.options : defaults.options) : undefined,
    config: { ...defaults.config, ...(allowOther ? { allowOther } : {}) },
  }
}

export function duplicateField(field: Field): Field {
  return {
    ...structuredClone(field),
    id: newId(),
    options: field.options?.map((o) => ({ ...o, id: newId() })),
  }
}
