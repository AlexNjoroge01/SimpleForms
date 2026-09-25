"use client"

import * as React from "react"
import { RiAddLine } from "@remixicon/react"

import { BuilderToolbar } from "@/components/builder/builder-toolbar"
import { FieldEditorPanel } from "@/components/builder/field-editor-panel"
import { FieldTypePicker } from "@/components/builder/field-type-picker"
import { FormCanvas } from "@/components/builder/form-canvas"
import { useAutosave } from "@/components/builder/use-autosave"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import type { Field, FieldType } from "@/lib/fields/types"
import { useBuilderStore } from "@/stores/builder-store"

type InitialForm = {
  id: string
  title: string
  description: string | null
  fields: Field[]
  status: "DRAFT" | "PUBLISHED" | "CLOSED"
}

const DESKTOP = "(min-width: 1024px)"

function isTypingTarget(t: EventTarget | null) {
  return t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))
}

// Builder (§9.4): picker | canvas | editor on desktop; canvas + bottom sheets on mobile.
export function Builder({ form }: { form: InitialForm }) {
  // Load the form into the store before first paint (Builder is keyed by form id).
  React.useState(() => useBuilderStore.getState().init(form))

  const { status, saveNow } = useAutosave()
  const select = useBuilderStore((s) => s.select)
  const addField = useBuilderStore((s) => s.addField)
  const hasSelection = useBuilderStore((s) => s.selectedId !== null)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [editorOpen, setEditorOpen] = React.useState(false)

  const isDesktop = () => window.matchMedia(DESKTOP).matches

  function onSelectField(id: string) {
    select(id)
    if (!isDesktop()) setEditorOpen(true)
  }

  function onPick(type: FieldType, preset?: "kenya_counties") {
    addField(type, preset)
    setPickerOpen(false)
    // Scroll the new field into view once rendered.
    requestAnimationFrame(() => {
      const id = useBuilderStore.getState().selectedId
      document.querySelector(`[aria-pressed="true"]`)?.scrollIntoView({ behavior: "smooth", block: "center" })
      if (id && !isDesktop()) setEditorOpen(true)
    })
  }

  // Undo / redo shortcuts (native undo still applies inside text inputs).
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || isTypingTarget(e.target)) return
      const key = e.key.toLowerCase()
      const { undo, redo } = useBuilderStore.getState()
      if (key === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="flex h-[calc(100svh-64px)] flex-col">
      <BuilderToolbar status={status} formStatus={form.status} onRetry={saveNow} />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside className="hidden overflow-x-hidden overflow-y-auto border-r border-line p-4 lg:block" aria-label="Question types">
          <FieldTypePicker onPick={onPick} />
        </aside>

        <div className="min-h-0 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && select(null)}>
          <FormCanvas onSelectField={onSelectField} onAddQuestion={() => setPickerOpen(true)} />
        </div>

        <aside className="hidden overflow-x-hidden overflow-y-auto border-l border-line bg-surface/50 p-5 lg:block" aria-label="Question settings">
          <FieldEditorPanel />
        </aside>
      </div>

      {/* Mobile: floating add button + bottom sheets */}
      <Button
        size="lg"
        onClick={() => setPickerOpen(true)}
        className="fixed right-4 bottom-4 z-30 shadow-float lg:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <RiAddLine data-icon="inline-start" /> Add question
      </Button>

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto rounded-t-card bg-bg p-4 lg:hidden">
          <SheetTitle className="sr-only">Add a question</SheetTitle>
          <FieldTypePicker onPick={onPick} />
        </SheetContent>
      </Sheet>

      {/* Deselecting (delete/undo) closes the mobile editor. */}
      <Sheet open={editorOpen && hasSelection} onOpenChange={setEditorOpen}>
        <SheetContent side="bottom" className="max-h-[85svh] overflow-y-auto rounded-t-card bg-bg p-5 pt-10 lg:hidden">
          <SheetTitle className="sr-only">Edit question</SheetTitle>
          <FieldEditorPanel />
        </SheetContent>
      </Sheet>
    </div>
  )
}
