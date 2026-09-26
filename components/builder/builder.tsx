"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RiAddLine } from "@remixicon/react"
import { toast } from "sonner"

import { publishForm } from "@/app/(app)/forms/[id]/edit/actions"
import { BuilderToolbar } from "@/components/builder/builder-toolbar"
import { FieldEditorPanel } from "@/components/builder/field-editor-panel"
import { FieldTypePicker } from "@/components/builder/field-type-picker"
import { FormCanvas } from "@/components/builder/form-canvas"
import { PublishIssuesDialog } from "@/components/builder/publish-issues-dialog"
import { SettingsDialog } from "@/components/builder/settings-dialog"
import { useAutosave } from "@/components/builder/use-autosave"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { canonicalJson } from "@/lib/fields/canonical"
import { publishIssues, type PublishIssue } from "@/lib/fields/publish"
import type { Field, FieldType, FormSettings } from "@/lib/fields/types"
import { useBuilderStore } from "@/stores/builder-store"

type FormStatus = "DRAFT" | "PUBLISHED" | "CLOSED"

type InitialForm = {
  id: string
  title: string
  description: string | null
  fields: Field[]
  status: FormStatus
  slug: string | null
  settings: FormSettings
  published: { title: string | null; description: string | null; fields: Field[] | null }
}

type Snapshot = InitialForm["published"]

const DESKTOP = "(min-width: 1024px)"

function isTypingTarget(t: EventTarget | null) {
  return t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))
}

/** Same normalisation the server applies on save, so comparisons are fair. */
function normalizedDoc(s: { title: string; description: string; fields: Field[] }) {
  return canonicalJson({ title: s.title.trim() || "Untitled form", description: s.description.trim() || null, fields: s.fields })
}

// Builder (§9.4): picker | canvas | editor on desktop; canvas + bottom sheets on mobile.
export function Builder({ form }: { form: InitialForm }) {
  // Load the form into the store before first paint (Builder is keyed by form id).
  React.useState(() => useBuilderStore.getState().init(form))

  const router = useRouter()
  const { status, saveNow } = useAutosave()
  const select = useBuilderStore((s) => s.select)
  const addField = useBuilderStore((s) => s.addField)
  const hasSelection = useBuilderStore((s) => s.selectedId !== null)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [editorOpen, setEditorOpen] = React.useState(false)

  const [formStatus, setFormStatus] = React.useState<FormStatus>(form.status)
  const [settings, setSettings] = React.useState(form.settings)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [settingsKey, setSettingsKey] = React.useState(0)
  const [published, setPublished] = React.useState<Snapshot>(form.published)
  const [publishing, setPublishing] = React.useState(false)
  const [issues, setIssues] = React.useState<PublishIssue[]>([])

  const publishedKey = React.useMemo(
    () =>
      published.fields
        ? canonicalJson({ title: published.title, description: published.description, fields: published.fields })
        : null,
    [published]
  )
  const hasUnpublishedChanges = useBuilderStore((s) => publishedKey === null || normalizedDoc(s) !== publishedKey)

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

  async function ensureSaved() {
    const ok = await saveNow()
    if (!ok) toast.error("Your latest changes aren’t saved yet. Try again in a moment.")
    return ok
  }

  async function onPreview() {
    if (await ensureSaved()) router.push(`/forms/${form.id}/preview`)
  }

  async function onPublish() {
    const s = useBuilderStore.getState()
    const local = publishIssues(s.title.trim() || "Untitled form", s.fields)
    if (local.length) return setIssues(local)

    setPublishing(true)
    try {
      if (!(await ensureSaved())) return
      const res = await publishForm(form.id)
      if (!res.ok) {
        if (res.issues?.length) setIssues(res.issues)
        else toast.error(res.error)
        return
      }
      const now = useBuilderStore.getState()
      setPublished({ title: now.title.trim() || "Untitled form", description: now.description.trim() || null, fields: now.fields })
      const firstPublish = formStatus === "DRAFT"
      setFormStatus(res.status)
      if (firstPublish) {
        toast.success("Your form is live!")
        router.push(`/forms/${form.id}/share`)
      } else {
        toast.success("Changes published", {
          action: { label: "View", onClick: () => window.open(`/f/${res.slug}`, "_blank", "noopener") },
        })
      }
    } catch {
      toast.error("Couldn’t publish. Check your connection and try again.")
    } finally {
      setPublishing(false)
    }
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
      <BuilderToolbar
        formId={form.id}
        status={status}
        onRetry={saveNow}
        publish={{ formStatus, hasUnpublishedChanges, publishing }}
        onPublish={onPublish}
        onPreview={onPreview}
        onSettings={() => {
          setSettingsKey((k) => k + 1)
          setSettingsOpen(true)
        }}
      />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside className="hidden overflow-x-hidden overflow-y-auto border-r border-line p-4 lg:block" aria-label="Question types">
          <FieldTypePicker onPick={onPick} />
        </aside>

        <div className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && select(null)}>
            <FormCanvas onSelectField={onSelectField} onAddQuestion={() => setPickerOpen(true)} />
          </div>
        </div>

        <aside className="hidden overflow-x-hidden overflow-y-auto border-l border-line bg-surface/50 p-5 lg:block" aria-label="Question settings">
          <FieldEditorPanel />
        </aside>
      </div>

      {/* Mobile: floating add button + bottom sheets */}
      <Button
        size="lg"
        onClick={() => setPickerOpen(true)}
        className="fixed right-4 bottom-20 z-30 shadow-float lg:hidden"
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

      <SettingsDialog key={settingsKey} formId={form.id} open={settingsOpen} onOpenChange={setSettingsOpen} settings={settings} onSaved={setSettings} />
      <PublishIssuesDialog
        issues={issues}
        onClose={() => setIssues([])}
        onSelectField={(id) => {
          setIssues([])
          onSelectField(id)
        }}
      />
    </div>
  )
}
