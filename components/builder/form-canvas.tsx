"use client"

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { RiAddLine, RiFileList3Line } from "@remixicon/react"

import { FieldCard } from "@/components/builder/field-card"
import { Button } from "@/components/ui/button"
import { LIMITS } from "@/lib/fields/registry"
import { useBuilderStore } from "@/stores/builder-store"

export function FormCanvas({ onSelectField, onAddQuestion }: { onSelectField: (id: string) => void; onAddQuestion: () => void }) {
  const title = useBuilderStore((s) => s.title)
  const description = useBuilderStore((s) => s.description)
  const fields = useBuilderStore((s) => s.fields)
  const selectedId = useBuilderStore((s) => s.selectedId)
  const { setTitle, setDescription, move, duplicate, remove } = useBuilderStore.getState()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function onDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) move(String(active.id), String(over.id))
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 pt-8 pb-32 md:px-6">
      {/* Inline-editable title + description */}
      <div className="rounded-card bg-surface p-6 shadow-card md:p-8">
        <label htmlFor="form-title" className="sr-only">
          Form title
        </label>
        <input
          id="form-title"
          value={title}
          maxLength={LIMITS.labelMax}
          placeholder="Untitled form"
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg bg-transparent text-[28px] leading-tight font-extrabold tracking-[-0.02em] text-ink outline-none placeholder:text-ink-subtle focus-visible:outline-2 focus-visible:outline-offset-4 md:text-[34px]"
        />
        <label htmlFor="form-description" className="sr-only">
          Form description
        </label>
        <textarea
          id="form-description"
          value={description}
          maxLength={2000}
          rows={1}
          placeholder="Add a description (optional)"
          onChange={(e) => setDescription(e.target.value)}
          className="field-sizing-content mt-3 w-full resize-none rounded-lg bg-transparent text-[16px] leading-relaxed text-ink-muted outline-none placeholder:text-ink-subtle focus-visible:outline-2 focus-visible:outline-offset-4"
        />
      </div>

      {fields.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border-2 border-dashed border-line px-6 py-12 text-center">
          <div className="grid size-12 place-items-center rounded-[14px] bg-brand-tint">
            <RiFileList3Line className="size-[22px] text-brand" aria-hidden />
          </div>
          <h2 className="h3">Add your first question</h2>
          <p className="max-w-xs text-[15px]">Pick a question type to get started. You can reorder questions by dragging.</p>
          <Button onClick={onAddQuestion} size="lg" className="mt-2 lg:hidden">
            <RiAddLine data-icon="inline-start" /> Add question
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
          <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-4" aria-label="Questions">
              {fields.map((field, i) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  index={i}
                  selected={field.id === selectedId}
                  onSelect={() => onSelectField(field.id)}
                  onDuplicate={() => duplicate(field.id)}
                  onDelete={() => remove(field.id)}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
