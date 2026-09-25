import { parsePhoneNumberFromString } from "libphonenumber-js"

// Kenyan mobile numbers (Blueprint §8). Accepts 0712345678, 712345678,
// +254712345678, 254712345678, 0112345678 — with spaces/dashes/brackets.

function toNational(input: string): string | null {
  const s = input.replace(/[\s\-().]/g, "")
  if (/^\+254\d+$/.test(s)) return s.slice(4)
  if (/^254\d{9}$/.test(s)) return s.slice(3)
  if (/^0\d{9}$/.test(s)) return s.slice(1)
  if (/^\d{9}$/.test(s)) return s
  return null
}

/** E.164 (`+254712345678`) or null if not a valid Kenyan mobile number. */
export function normalizeKenyanPhone(input: string): string | null {
  const national = toNational(input.trim())
  // National number: 9 digits starting with 7 or 1.
  if (!national || !/^[17]\d{8}$/.test(national)) return null
  const parsed = parsePhoneNumberFromString(`+254${national}`, "KE")
  return parsed?.isValid() ? parsed.number : null
}

/** `+254712345678` → `+254 712 345 678` (falls back to the input). */
export function formatKenyanPhone(e164: string): string {
  const m = /^\+254(\d{3})(\d{3})(\d{3})$/.exec(e164)
  return m ? `+254 ${m[1]} ${m[2]} ${m[3]}` : e164
}
