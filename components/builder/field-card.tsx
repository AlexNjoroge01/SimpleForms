"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { RiDeleteBinLine, RiDraggable, RiFileCopyLine } from "@remixicon/react"

import { FieldPreview } from "@/components/builder/field-preview"
import { Button } from "@/components/ui/button"
import { FIELD_REGISTRY } from "@/lib/fields/registry"
import type { Field } from "@/lib/fields/types"
import { cn } from "@/lib/utils"

export function FieldCard({
  field,
  index,
  selected,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  field: Field
  index: number
  selected: boolean
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  })
  const def = FIELD_REGISTRY[field.type]
  const Icon = def.icon

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "group relative rounded-card bg-surface p-5 shadow-card transition-shadow md:p-6",
        selected && "ring-2 ring-brand",
        isDragging && "z-10 shadow-float"
      )}
    >
      {/* Whole card selects the field; controls sit above this layer. */}
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Edit question ${index + 1}: ${field.label || "Untitled question"}`}
        aria-pressed={selected}
        className="absolute inset-0 rounded-card"
      />

      <div className="pointer-events-none relative flex items-start gap-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="pointer-events-auto -ml-2 grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-ink-subtle hover:bg-bg hover:text-ink active:cursor-grabbing"
        >
          <RiDraggable className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[12px] font-bold tracking-[0.06em] text-ink-muted uppercase">
            <Icon className="size-4 text-brand" aria-hidden />
            {def.label}
          </div>
          <h3 className="mt-2 text-[17px] leading-snug font-bold break-words text-ink">
            {field.label || <span className="text-ink-subtle">Untitled question</span>}
            {field.required && (
              <span className="ml-1 text-destructive" aria-label="required">
                *
              </span>
            )}
          </h3>
          {field.description && <p className="mt-1 text-[14px] break-words">{field.description}</p>}
        </div>
        <div className="pointer-events-auto flex shrink-0 gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
          <Button variant="ghost" size="icon-sm" onClick={onDuplicate} aria-label="Duplicate question">
            <RiFileCopyLine />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label="Delete question" className="hover:text-destructive">
            <RiDeleteBinLine />
          </Button>
        </div>
      </div>

      <div className="pointer-events-none relative mt-4 pl-8" aria-hidden>
        <FieldPreview field={field} />
      </div>
    </li>
  )
}
