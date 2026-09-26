// KES formatting (Blueprint §8). Display only — CSV exports raw numbers.

const grouping = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 })

/** 1500 → "KES 1,500"; 1500.5 → "KES 1,500.5" */
export function formatKES(n: number): string {
  return `KES ${grouping.format(n)}`
}

/** 1500 → "1,500" (no currency) */
export function formatNumber(n: number): string {
  return grouping.format(n)
}

/**
 * Formats an amount while the user types: keeps digits, one decimal point
 * (max 2 decimals) and optionally a leading minus; adds thousands separators.
 * "1500" → "1,500", "1500.5" → "1,500.5", "12,34a5" → "12,345".
 */
export function formatAmountTyping(input: string, { allowNegative = false } = {}): string {
  const negative = allowNegative && input.trim().startsWith("-")
  const cleaned = input.replace(/[^\d.]/g, "")
  const dot = cleaned.indexOf(".")
  const intPart = (dot === -1 ? cleaned : cleaned.slice(0, dot)).replace(/^0+(?=\d)/, "")
  const decPart = dot === -1 ? null : cleaned.slice(dot + 1).replace(/\./g, "").slice(0, 2)
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `${negative ? "-" : ""}${grouped}${decPart === null ? "" : `.${decPart}`}`
}
