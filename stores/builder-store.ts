"use client"

import { arrayMove } from "@dnd-kit/sortable"
import { create } from "zustand"

import { changeFieldType, createField, duplicateField } from "@/lib/fields/registry"
import type { Field, FieldType } from "@/lib/fields/types"

// Builder state (Blueprint §9.4): Zustand with undo/redo, last 50 states.

type Doc = { title: string; description: string; fields: Field[] }

const HISTORY_LIMIT = 50
const COALESCE_MS = 1000

type BuilderState = Doc & {
  formId: string | null
  selectedId: string | null
  past: Doc[]
  future: Doc[]
  /** Increments on every document change; autosave watches it. */
  version: number
  lastKey: string | null
  lastAt: number

  init: (form: { id: string; title: string; description: string | null; fields: Field[] }) => void
  select: (id: string | null) => void
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  addField: (type: FieldType, preset?: "kenya_counties") => void
  updateField: (id: string, patch: Partial<Field>, coalesceKey?: string) => void
  changeType: (id: string, type: FieldType) => void
  duplicate: (id: string) => void
  remove: (id: string) => void
  move: (activeId: string, overId: string) => void
  replaceFields: (fields: Field[]) => void
  undo: () => void
  redo: () => void
}

const docOf = (s: Doc): Doc => ({ title: s.title, description: s.description, fields: s.fields })

export const useBuilderStore = create<BuilderState>()((set, get) => {
  /**
   * Apply a document change and record history. Consecutive edits sharing a
   * `coalesceKey` within 1s (e.g. typing a label) collapse into one undo step.
   */
  function commit(recipe: (s: BuilderState) => Partial<Doc & { selectedId: string | null }>, coalesceKey?: string) {
    const s = get()
    const now = Date.now()
    const coalesce = !!coalesceKey && coalesceKey === s.lastKey && now - s.lastAt < COALESCE_MS
    set({
      ...recipe(s),
      past: coalesce ? s.past : [...s.past, docOf(s)].slice(-HISTORY_LIMIT),
      future: [],
      version: s.version + 1,
      lastKey: coalesceKey ?? null,
      lastAt: now,
    })
  }

  const mapField = (id: string, fn: (f: Field) => Field) => (s: BuilderState) => ({
    fields: s.fields.map((f) => (f.id === id ? fn(f) : f)),
  })

  return {
    formId: null,
    title: "",
    description: "",
    fields: [],
    selectedId: null,
    past: [],
    future: [],
    version: 0,
    lastKey: null,
    lastAt: 0,

    init: (form) =>
      set({
        formId: form.id,
        title: form.title,
        description: form.description ?? "",
        fields: form.fields,
        selectedId: null,
        past: [],
        future: [],
        version: 0,
        lastKey: null,
      }),

    select: (id) => set({ selectedId: id }),

    setTitle: (title) => commit(() => ({ title }), "title"),
    setDescription: (description) => commit(() => ({ description }), "description"),

    addField: (type, preset) => {
      const field = createField(type, preset)
      commit((s) => {
        // Insert after the selected field, else at the end.
        const at = s.selectedId ? s.fields.findIndex((f) => f.id === s.selectedId) + 1 : s.fields.length
        const fields = [...s.fields]
        fields.splice(at > 0 ? at : fields.length, 0, field)
        return { fields, selectedId: field.id }
      })
    },

    updateField: (id, patch, coalesceKey) =>
      commit(mapField(id, (f) => ({ ...f, ...patch })), coalesceKey ? `${id}:${coalesceKey}` : undefined),

    changeType: (id, type) => commit(mapField(id, (f) => changeFieldType(f, type))),

    duplicate: (id) =>
      commit((s) => {
        const i = s.fields.findIndex((f) => f.id === id)
        if (i < 0) return {}
        const copy = duplicateField(s.fields[i])
        const fields = [...s.fields]
        fields.splice(i + 1, 0, copy)
        return { fields, selectedId: copy.id }
      }),

    remove: (id) =>
      commit((s) => ({
        fields: s.fields.filter((f) => f.id !== id),
        selectedId: s.selectedId === id ? null : s.selectedId,
      })),

    move: (activeId, overId) =>
      commit((s) => {
        const from = s.fields.findIndex((f) => f.id === activeId)
        const to = s.fields.findIndex((f) => f.id === overId)
        return from < 0 || to < 0 || from === to ? {} : { fields: arrayMove(s.fields, from, to) }
      }),

    replaceFields: (fields) => commit(() => ({ fields })),

    undo: () => {
      const s = get()
      const prev = s.past.at(-1)
      if (!prev) return
      set({
        ...prev,
        past: s.past.slice(0, -1),
        future: [docOf(s), ...s.future].slice(0, HISTORY_LIMIT),
        version: s.version + 1,
        lastKey: null,
        selectedId: prev.fields.some((f) => f.id === s.selectedId) ? s.selectedId : null,
      })
    },

    redo: () => {
      const s = get()
      const next = s.future[0]
      if (!next) return
      set({
        ...next,
        past: [...s.past, docOf(s)].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        version: s.version + 1,
        lastKey: null,
        selectedId: next.fields.some((f) => f.id === s.selectedId) ? s.selectedId : null,
      })
    },
  }
})
