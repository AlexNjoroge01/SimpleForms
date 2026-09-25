"use client"

import { PICKER_ITEMS } from "@/lib/fields/registry"
import type { FieldType } from "@/lib/fields/types"

export function FieldTypePicker({ onPick }: { onPick: (type: FieldType, preset?: "kenya_counties") => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="eyebrow">Add a question</p>
      <ul className="grid gap-1.5">
        {PICKER_ITEMS.map(({ key, type, label, hint, icon: Icon, preset }) => (
          <li key={key}>
            <button
              type="button"
              onClick={() => onPick(type, preset)}
              className="group flex w-full items-center gap-3 rounded-input p-2 text-left transition-colors duration-150 hover:bg-surface focus-visible:bg-surface"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand-tint text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                <Icon className="size-[18px]" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-ink">{label}</span>
                <span className="block truncate text-[12px] text-ink-muted">{hint}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
