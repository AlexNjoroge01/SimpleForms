import { choiceLabels, FIELD_REGISTRY } from "@/lib/fields/registry"
import type { Field } from "@/lib/fields/types"

// Publish validation (Blueprint §9.6): ≥1 field, every choice field has ≥2
// options, no empty labels. Pure so the builder can show problems before calling
// the server, and the server re-checks.

export type PublishIssue = { fieldId?: string; message: string }

export function publishIssues(title: string, fields: Field[]): PublishIssue[] {
  const issues: PublishIssue[] = []
  if (!title.trim()) issues.push({ message: "Give your form a title." })
  if (fields.length === 0) issues.push({ message: "Add at least one question." })

  fields.forEach((f, i) => {
    const n = `Question ${i + 1}`
    if (!f.label.trim()) issues.push({ fieldId: f.id, message: `${n} needs a label.` })

    if (FIELD_REGISTRY[f.type].supportsOptions) {
      const labels = choiceLabels(f).map((l) => l.trim())
      if (labels.filter(Boolean).length < 2) issues.push({ fieldId: f.id, message: `${n} needs at least two options.` })
      if (labels.some((l) => !l)) issues.push({ fieldId: f.id, message: `${n} has an empty option.` })
      if (new Set(labels).size !== labels.length) issues.push({ fieldId: f.id, message: `${n} has duplicate options.` })
    }

    const c = f.config ?? {}
    if (c.min !== undefined && c.max !== undefined && c.min > c.max)
      issues.push({ fieldId: f.id, message: `${n}: the minimum is larger than the maximum.` })
    if (c.minSelect !== undefined && c.maxSelect !== undefined && c.minSelect > c.maxSelect)
      issues.push({ fieldId: f.id, message: `${n}: “min choices” is larger than “max choices”.` })
    if (c.minDate && c.maxDate && c.minDate > c.maxDate)
      issues.push({ fieldId: f.id, message: `${n}: the earliest date is after the latest date.` })
  })

  return issues
}
