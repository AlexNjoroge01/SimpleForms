import Papa from "papaparse"

import { FIELD_REGISTRY } from "@/lib/fields/registry"
import type { AnswerValue, Field } from "@/lib/fields/types"

// CSV export helpers (Blueprint §11, §19).

export const CSV_BOM = "﻿"

/**
 * CSV-injection guard (§19): cells starting with = + - @ (or tab/CR, which
 * some spreadsheets strip first) are prefixed with a single quote so they
 * can't run as formulas. Numbers and normalized phone numbers are trusted —
 * they're validated server-side and must stay exportable as-is.
 */
export function guardCell(value: string, trusted = false): string {
  if (trusted) return value
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}

/** One CSV line (RFC 4180 quoting, CRLF). */
export function csvLine(cells: string[]): string {
  return Papa.unparse([cells], { header: false, newline: "\r\n", quotes: false }) + "\r\n"
}

const nairobi = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Nairobi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
})

/** `2026-03-05 14:07:09` in Africa/Nairobi. */
export function nairobiTimestamp(d: Date): string {
  const p = Object.fromEntries(nairobi.formatToParts(d).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`
}

/** `2026-03-05` in Africa/Nairobi. */
export function nairobiDate(d: Date): string {
  return nairobiTimestamp(d).slice(0, 10)
}

/** Serializes one answer via the field registry, then guards it. */
export function csvCell(field: Field, value: AnswerValue | undefined, fileUrl?: (uploadId: string) => string): string {
  if (value === undefined || value === null) return ""
  if (field.type === "file_upload") {
    const ids = Array.isArray(value) ? value : [String(value)]
    return guardCell(ids.map((id) => (fileUrl ? fileUrl(id) : id)).join("; "))
  }
  const text = FIELD_REGISTRY[field.type].toCsv(value)
  const trusted =
    (field.type === "number" && typeof value === "number") ||
    (field.type === "phone" && /^\+254\d{9}$/.test(String(value)))
  return guardCell(text, trusted)
}

/** `Harambee Registration` → `harambee-registration` */
export function fileSlug(title: string) {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "form"
  )
}

export function exportFilename(title: string, now = new Date()) {
  return `${fileSlug(title)}-responses-${nairobiDate(now)}.csv`
}
