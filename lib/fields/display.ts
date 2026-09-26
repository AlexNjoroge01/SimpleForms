import { format } from "date-fns"

import { formatKES, formatNumber } from "@/lib/kenya/currency"
import { formatKenyanPhone } from "@/lib/kenya/phone"
import type { AnswerValue, Field } from "@/lib/fields/types"

// Human-readable answers for the responses table/drawer and emails.
export function formatAnswer(field: Field, value: AnswerValue | undefined): string {
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) return "—"
  switch (field.type) {
    case "phone":
      return formatKenyanPhone(String(value))
    case "number":
      if (typeof value !== "number") return String(value)
      return field.config?.currency === "KES" ? formatKES(value) : formatNumber(value)
    case "multiple_choice":
      return Array.isArray(value) ? value.join(", ") : String(value)
    case "yes_no":
      return value === "yes" ? "Yes" : value === "no" ? "No" : String(value)
    case "date": {
      const d = new Date(`${value}T00:00:00`)
      return Number.isNaN(d.getTime()) ? String(value) : format(d, "d MMM yyyy")
    }
    case "file_upload":
      return "File attached"
    default:
      return String(value)
  }
}
