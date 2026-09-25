"use client"

import * as React from "react"
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { RiAddLine, RiCloseLine, RiDraggable } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LIMITS } from "@/lib/fields/registry"
import type { FieldOption } from "@/lib/fields/types"
import { newId } from "@/lib/ids"

type Change = (options: FieldOption[], coalesceKey?: string) => void

function OptionRow({
  option,
  index,
  canRemove,
  onLabel,
  onPasteLines,
  onRemove,
  onEnter,
  inputRef,
}: {
  option: FieldOption
  index: number
  canRemove: boolean
  onLabel: (label: string) => void
  onPasteLines: (lines: string[]) => void
  onRemove: () => void
  onEnter: () => void
  inputRef: (el: HTMLInputElement | null) => void
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition } = useSortable({ id: option.id })

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className="flex items-center gap-1.5">
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Reorder option ${index + 1}`}
        className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-ink-subtle hover:text-ink"
      >
        <RiDraggable className="size-4" />
      </button>
      <Input
        ref={inputRef}
        value={option.label}
        maxLength={LIMITS.optionMax}
        aria-label={`Option ${index + 1}`}
        placeholder={`Option ${index + 1}`}
        className="h-10 bg-surface"
        onChange={(e) => onLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            onEnter()
          }
        }}
        onPaste={(e) => {
          const lines = e.clipboardData
            .getData("text")
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean)
          if (lines.length > 1) {
            e.preventDefault()
            onPasteLines(lines)
          }
        }}
      />
      <Button variant="ghost" size="icon-sm" onClick={onRemove} disabled={!canRemove} aria-label={`Remove option ${index + 1}`}>
        <RiCloseLine />
      </Button>
    </li>
  )
}

export function OptionsEditor({ options, onChange }: { options: FieldOption[]; onChange: Change }) {
  const inputs = React.useRef(new Map<string, HTMLInputElement>())
  const focusNext = React.useRef<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  React.useEffect(() => {
    if (focusNext.current) {
      inputs.current.get(focusNext.current)?.focus()
      focusNext.current = null
    }
  })

  function insertAfter(index: number, labels: string[]) {
    const added = labels.map((label) => ({ id: newId(), label: label.slice(0, LIMITS.optionMax) }))
    const next = [...options.slice(0, index + 1), ...added, ...options.slice(index + 1)].slice(0, LIMITS.optionsMax)
    focusNext.current = added.at(-1)?.id ?? null
    onChange(next)
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = options.findIndex((o) => o.id === active.id)
    const to = options.findIndex((o) => o.id === over.id)
    onChange(arrayMove(options, from, to))
  }

  return (
    <div className="flex flex-col gap-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={options.map((o) => o.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-1.5">
            {options.map((o, i) => (
              <OptionRow
                key={o.id}
                option={o}
                index={i}
                canRemove={options.length > 1}
                inputRef={(el) => (el ? inputs.current.set(o.id, el) : inputs.current.delete(o.id))}
                onLabel={(label) =>
                  onChange(
                    options.map((x) => (x.id === o.id ? { ...x, label } : x)),
                    `option:${o.id}`
                  )
                }
                onPasteLines={([first, ...rest]) => {
                  const replaced = options.map((x) => (x.id === o.id && !x.label ? { ...x, label: first } : x))
                  const labels = o.label ? [first, ...rest] : rest
                  const added = labels.map((label) => ({ id: newId(), label: label.slice(0, LIMITS.optionMax) }))
                  onChange([...replaced.slice(0, i + 1), ...added, ...replaced.slice(i + 1)].slice(0, LIMITS.optionsMax))
                }}
                onRemove={() => onChange(options.filter((x) => x.id !== o.id))}
                onEnter={() => insertAfter(i, [""])}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <Button
        variant="ghost"
        className="self-start text-brand"
        onClick={() => insertAfter(options.length - 1, [""])}
        disabled={options.length >= LIMITS.optionsMax}
      >
        <RiAddLine data-icon="inline-start" /> Add option
      </Button>
      <p className="footnote">Tip: paste a list (one per line) to add many options at once.</p>
    </div>
  )
}
