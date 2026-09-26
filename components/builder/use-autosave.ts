"use client"

import * as React from "react"
import { toast } from "sonner"

import { saveDraft } from "@/app/(app)/forms/[id]/edit/actions"
import { useBuilderStore } from "@/stores/builder-store"

export type SaveStatus = "saved" | "unsaved" | "saving" | "error"

const DEBOUNCE_MS = 1500

/** Debounced draft autosave (§9.4). Saves run one at a time, in order. */
export function useAutosave() {
  const version = useBuilderStore((s) => s.version)
  const [status, setStatus] = React.useState<SaveStatus>("saved")
  const savedVersion = React.useRef(0)
  const queue = React.useRef<Promise<void>>(Promise.resolve())

  const save = React.useCallback(() => {
    queue.current = queue.current.then(async () => {
      const s = useBuilderStore.getState()
      const v = s.version
      if (!s.formId || v === savedVersion.current) return
      setStatus("saving")
      try {
        const res = await saveDraft(s.formId, { title: s.title, description: s.description, fields: s.fields })
        if (!res.ok) throw new Error(res.error)
        savedVersion.current = v
        setStatus(useBuilderStore.getState().version === v ? "saved" : "unsaved")
      } catch (err) {
        setStatus("error")
        toast.error("Couldn’t save your changes", {
          description: err instanceof Error ? err.message : undefined,
          id: "autosave-error",
        })
      }
    })
    // Resolves true when everything up to now is saved (publish/preview rely on it).
    return queue.current.then(() => useBuilderStore.getState().version === savedVersion.current)
  }, [])

  React.useEffect(() => {
    if (version === savedVersion.current) return
    setStatus("unsaved")
    const t = setTimeout(save, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [version, save])

  // Warn before leaving with unsaved changes.
  React.useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useBuilderStore.getState().version !== savedVersion.current) e.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [])

  return { status, saveNow: save }
}
