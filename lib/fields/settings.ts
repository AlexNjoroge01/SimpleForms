import { z } from "zod"

import { DEFAULT_FORM_SETTINGS, FORM_THEMES, type FormSettings } from "@/lib/fields/types"

// Per-form accent presets (Blueprint §16: 8 presets). The first is the Design.md
// brand green; the rest are derived hues chosen for AA contrast with white text.
export const ACCENT_PRESETS = [
  { name: "Emerald", value: "#067353" },
  { name: "Teal", value: "#0F766E" },
  { name: "Blue", value: "#1D4ED8" },
  { name: "Violet", value: "#6D28D9" },
  { name: "Pink", value: "#BE185D" },
  { name: "Red", value: "#B91C1C" },
  { name: "Orange", value: "#C2410C" },
  { name: "Ink", value: "#122119" },
] as const

const accentValues = ACCENT_PRESETS.map((p) => p.value) as [string, ...string[]]

export const settingsSchema = z.object({
  theme: z.enum(FORM_THEMES),
  accentColor: z.enum(accentValues),
  submitButtonText: z.string().trim().min(1, "Button text can’t be empty").max(40),
  successMessage: z.string().trim().min(1, "Add a message").max(500),
  closeAt: z.iso.datetime({ offset: true }).nullable().optional(),
  responseLimit: z.number().int().min(1).max(1_000_000).nullable().optional(),
  showBranding: z.boolean(),
}) satisfies z.ZodType<FormSettings>

/** Stored settings merged over defaults (older rows may miss newer keys). */
export function resolveSettings(s: Partial<FormSettings> | null | undefined): FormSettings {
  return { ...DEFAULT_FORM_SETTINGS, ...s }
}

export type Availability = "open" | "closed" | "limit_reached" | "not_published"

/** Can the public submit right now? (Blueprint §10.1) */
export function formAvailability(
  form: { status: "DRAFT" | "PUBLISHED" | "CLOSED"; responseCount: number; publishedFields: unknown },
  settings: FormSettings,
  now = new Date()
): Availability {
  if (form.status === "DRAFT" || !form.publishedFields) return "not_published"
  if (form.status === "CLOSED") return "closed"
  if (settings.closeAt && new Date(settings.closeAt) <= now) return "closed"
  if (settings.responseLimit && form.responseCount >= settings.responseLimit) return "limit_reached"
  return "open"
}
