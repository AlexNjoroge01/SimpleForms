import { describe, expect, it } from "vitest"

import { canonicalJson } from "@/lib/fields/canonical"
import { publishIssues } from "@/lib/fields/publish"
import { createField, options } from "@/lib/fields/registry"
import { formAvailability, resolveSettings, settingsSchema } from "@/lib/fields/settings"
import { DEFAULT_FORM_SETTINGS, type Field } from "@/lib/fields/types"
import { isValidSlug, newSlug, SLUG_LENGTH } from "@/lib/slug"

const named = (f: Field, label = "Question"): Field => ({ ...f, label })

describe("slug generator", () => {
  it("makes 8-char URL-safe slugs without ambiguous characters", () => {
    const slugs = Array.from({ length: 2000 }, () => newSlug())
    for (const s of slugs) {
      expect(s).toHaveLength(SLUG_LENGTH)
      expect(s).toMatch(/^[A-Za-z0-9]+$/)
      expect(s).not.toMatch(/[0O1lI]/)
      expect(isValidSlug(s)).toBe(true)
    }
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it("rejects malformed slugs", () => {
    for (const s of ["", "abc", "abcdefgh1", "abcdefgO", "../etc/p", "abcdefghi"]) expect(isValidSlug(s)).toBe(false)
  })
})

describe("publish validation (§9.6)", () => {
  it("needs at least one field and a title", () => {
    expect(publishIssues("", []).map((i) => i.message)).toEqual(["Give your form a title.", "Add at least one question."])
  })

  it("rejects empty labels", () => {
    const f = named(createField("short_text"), "  ")
    expect(publishIssues("Form", [f])).toEqual([{ fieldId: f.id, message: "Question 1 needs a label." }])
  })

  it("requires ≥2 non-empty, unique options on choice fields", () => {
    const one = { ...named(createField("single_choice")), options: options("Only") }
    const empty = { ...named(createField("dropdown")), options: options("A", "") }
    const dupes = { ...named(createField("multiple_choice")), options: options("A", "A") }
    const messages = publishIssues("Form", [one, empty, dupes]).map((i) => i.message)
    expect(messages).toContain("Question 1 needs at least two options.")
    expect(messages).toContain("Question 2 has an empty option.")
    expect(messages).toContain("Question 3 has duplicate options.")
  })

  it("accepts the county preset without options", () => {
    expect(publishIssues("Form", [createField("dropdown", "kenya_counties")])).toEqual([])
  })

  it("flags inverted ranges", () => {
    const n = { ...named(createField("number")), config: { min: 10, max: 1 } }
    expect(publishIssues("Form", [n])[0].message).toMatch(/minimum is larger/)
  })

  it("passes a valid form", () => {
    expect(publishIssues("Form", [named(createField("email")), named(createField("single_choice"))])).toEqual([])
  })
})

describe("form availability (§10.1)", () => {
  const base = { status: "PUBLISHED" as const, responseCount: 0, publishedFields: [] }
  const s = DEFAULT_FORM_SETTINGS

  it("is open when published", () => expect(formAvailability(base, s)).toBe("open"))
  it("is closed when status is CLOSED", () => expect(formAvailability({ ...base, status: "CLOSED" }, s)).toBe("closed"))
  it("is not published as a draft", () => expect(formAvailability({ ...base, status: "DRAFT" }, s)).toBe("not_published"))
  it("closes after closeAt", () => {
    const now = new Date("2026-05-01T12:00:00Z")
    expect(formAvailability(base, { ...s, closeAt: "2026-05-01T11:59:00Z" }, now)).toBe("closed")
    expect(formAvailability(base, { ...s, closeAt: "2026-05-01T12:01:00Z" }, now)).toBe("open")
  })
  it("stops at the response limit", () => {
    expect(formAvailability({ ...base, responseCount: 5 }, { ...s, responseLimit: 5 })).toBe("limit_reached")
    expect(formAvailability({ ...base, responseCount: 4 }, { ...s, responseLimit: 5 })).toBe("open")
  })
})

describe("settings", () => {
  it("validates presets and fills defaults", () => {
    expect(settingsSchema.safeParse({ ...DEFAULT_FORM_SETTINGS, accentColor: "#123456" }).success).toBe(false)
    expect(settingsSchema.safeParse({ ...DEFAULT_FORM_SETTINGS, closeAt: "2026-05-01T12:00:00.000Z" }).success).toBe(true)
    expect(resolveSettings({ theme: "dark" })).toEqual({ ...DEFAULT_FORM_SETTINGS, theme: "dark" })
  })
})

describe("canonicalJson", () => {
  it("ignores key order and undefined keys", () => {
    expect(canonicalJson({ b: 1, a: { d: [1, { y: 2, x: 1 }], c: undefined } })).toBe(
      canonicalJson({ a: { d: [1, { x: 1, y: 2 }] }, b: 1 })
    )
  })
})
