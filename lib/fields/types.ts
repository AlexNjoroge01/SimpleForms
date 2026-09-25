// Field specification (Blueprint §6). The registry in ./registry.ts builds on these.

export const FIELD_TYPES = [
  "short_text",
  "long_text",
  "email",
  "phone",
  "number",
  "single_choice",
  "multiple_choice",
  "dropdown",
  "date",
  "yes_no",
  "file_upload",
] as const

export type FieldType = (typeof FIELD_TYPES)[number]

export type FieldOption = { id: string; label: string }

export type FieldConfig = {
  maxLength?: number
  defaultCountry?: "KE"
  min?: number
  max?: number
  currency?: "KES"
  allowOther?: boolean
  minSelect?: number
  maxSelect?: number
  preset?: "kenya_counties"
  minDate?: string
  maxDate?: string
  maxSizeMB?: number
  accept?: "image" | "pdf" | "any"
}

export type Field = {
  id: string
  type: FieldType
  label: string
  description?: string
  placeholder?: string
  required: boolean
  options?: FieldOption[]
  config?: FieldConfig
}

export const FORM_THEMES = ["light", "dark"] as const

export type FormSettings = {
  theme: (typeof FORM_THEMES)[number]
  accentColor: string
  submitButtonText: string
  successMessage: string
  closeAt?: string | null
  responseLimit?: number | null
  showBranding: boolean
}

export const DEFAULT_FORM_SETTINGS: FormSettings = {
  theme: "light",
  accentColor: "#067353",
  submitButtonText: "Submit",
  successMessage: "Thank you! Your response has been recorded.",
  closeAt: null,
  responseLimit: null,
  showBranding: true,
}

export type AnswerValue = string | number | boolean | string[] | null
export type Answers = Record<string, AnswerValue>
