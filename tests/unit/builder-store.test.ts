import { beforeEach, describe, expect, it } from "vitest"

import { useBuilderStore } from "@/stores/builder-store"

const store = () => useBuilderStore.getState()

describe("builder store", () => {
  beforeEach(() => store().init({ id: "form1", title: "Form", description: null, fields: [] }))

  it("adds after the selected field and selects the new one", () => {
    store().addField("short_text")
    const first = store().fields[0].id
    store().addField("email")
    store().select(first)
    store().addField("phone")
    expect(store().fields.map((f) => f.type)).toEqual(["short_text", "phone", "email"])
    expect(store().selectedId).toBe(store().fields[1].id)
  })

  it("undoes and redoes structural changes", () => {
    store().addField("short_text")
    store().addField("yes_no")
    store().remove(store().fields[0].id)
    expect(store().fields).toHaveLength(1)
    store().undo()
    expect(store().fields).toHaveLength(2)
    store().redo()
    expect(store().fields).toHaveLength(1)
  })

  it("coalesces rapid typing into one undo step", () => {
    store().addField("short_text")
    const id = store().fields[0].id
    for (const label of ["N", "Na", "Nam", "Name"]) store().updateField(id, { label }, "label")
    expect(store().fields[0].label).toBe("Name")
    store().undo()
    expect(store().fields[0].label).toBe("Short answer")
  })

  it("keeps at most 50 history states", () => {
    for (let i = 0; i < 60; i++) store().addField("short_text")
    expect(store().past).toHaveLength(50)
  })

  it("reorders, duplicates with fresh ids, and switches compatible types", () => {
    store().addField("single_choice")
    store().addField("date")
    const [a, b] = store().fields
    store().move(b.id, a.id)
    expect(store().fields.map((f) => f.type)).toEqual(["date", "single_choice"])
    store().duplicate(a.id)
    const [, orig, copy] = store().fields
    expect(copy.id).not.toBe(orig.id)
    expect(copy.options?.[0].id).not.toBe(orig.options?.[0].id)
    store().changeType(orig.id, "dropdown")
    expect(store().fields[1].type).toBe("dropdown")
    expect(store().fields[1].options).toEqual(orig.options)
  })
})
