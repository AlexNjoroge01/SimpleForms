import { RiArrowDownSLine, RiCalendarLine, RiUploadCloud2Line } from "@remixicon/react"

import { choiceLabels, LIMITS } from "@/lib/fields/registry"
import type { Field } from "@/lib/fields/types"
import { cn } from "@/lib/utils"

// Static, non-interactive preview of a field on the builder canvas.
// The real, interactive renderers are the public-form components (Phase 3).

const box = "flex h-11 w-full items-center gap-2 rounded-input border border-line bg-bg/40 px-4 text-[15px] text-ink-subtle"

function Choice({ label, multi }: { label: string; multi: boolean }) {
  return (
    <div className="flex min-h-11 items-center gap-3 rounded-input border border-line bg-surface px-4 py-2 text-[15px] text-ink">
      <span className={cn("size-4 shrink-0 border-2 border-ink-subtle/60", multi ? "rounded-[4px]" : "rounded-full")} />
      <span className="truncate">{label || "Untitled option"}</span>
    </div>
  )
}

export function FieldPreview({ field }: { field: Field }) {
  const c = field.config ?? {}

  switch (field.type) {
    case "short_text":
    case "email":
      return <div className={box}>{field.placeholder}</div>
    case "long_text":
      return <div className={cn(box, "h-24 items-start py-3")}>{field.placeholder}</div>
    case "phone":
      return (
        <div className={box}>
          <span className="rounded-md bg-brand-tint px-2 py-0.5 text-[13px] font-semibold text-brand">🇰🇪 +254</span>
          {field.placeholder}
        </div>
      )
    case "number":
      return (
        <div className={box}>
          {c.currency === "KES" && <span className="text-[13px] font-bold text-ink-muted">KES</span>}
          {field.placeholder}
        </div>
      )
    case "single_choice":
    case "multiple_choice": {
      const labels = choiceLabels(field)
      return (
        <div className="grid gap-2">
          {labels.slice(0, 6).map((l, i) => (
            <Choice key={i} label={l} multi={field.type === "multiple_choice"} />
          ))}
          {labels.length > 6 && <p className="text-[13px]">+{labels.length - 6} more</p>}
          {c.allowOther && <Choice label="Other…" multi={field.type === "multiple_choice"} />}
        </div>
      )
    }
    case "dropdown": {
      const count = choiceLabels(field).length
      return (
        <div className={cn(box, "justify-between")}>
          <span className="truncate">
            {field.placeholder || "Select…"}
            {c.preset === "kenya_counties" && " · 47 counties"}
            {!c.preset && ` · ${count} ${count === 1 ? "option" : "options"}`}
          </span>
          <RiArrowDownSLine className="size-5 shrink-0" aria-hidden />
        </div>
      )
    }
    case "date":
      return (
        <div className={cn(box, "justify-between")}>
          DD / MM / YYYY
          <RiCalendarLine className="size-5 shrink-0" aria-hidden />
        </div>
      )
    case "yes_no":
      return (
        <div className="grid grid-cols-2 gap-3">
          {["Yes", "No"].map((l) => (
            <div key={l} className="grid h-12 place-items-center rounded-input border border-line bg-surface font-semibold text-ink">
              {l}
            </div>
          ))}
        </div>
      )
    case "file_upload": {
      const accept = { image: "Images", pdf: "PDF", any: "Any file" }[c.accept ?? "any"]
      return (
        <div className="flex flex-col items-center gap-1 rounded-input border-2 border-dashed border-line px-4 py-6 text-center text-[14px] text-ink-muted">
          <RiUploadCloud2Line className="size-6 text-brand" aria-hidden />
          Tap to upload · {accept} · up to {c.maxSizeMB ?? LIMITS.fileDefaultMB}MB
        </div>
      )
    }
  }
}
