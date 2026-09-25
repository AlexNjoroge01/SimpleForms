import { describe, expect, it } from "vitest"

import { buildZodSchema } from "@/lib/fields/build-zod-schema"
import { changeFieldType, compatibleTypes, createField, FIELD_REGISTRY, options } from "@/lib/fields/registry"
import { FIELD_TYPES, type Field, type FieldType } from "@/lib/fields/types"

function field(type: FieldType, patch: Partial<Field> = {}): Field {
  return { ...createField(type), id: "f1", ...patch }
}

function check(f: Field, value: unknown) {
  const r = buildZodSchema([f]).safeParse({ f1: value })
  return r.success ? { ok: true as const, value: r.data.f1 } : { ok: false as const, message: r.error.issues[0].message }
}

describe("registry", () => {
  it("defines all 11 field types", () => {
    expect(Object.keys(FIELD_REGISTRY).sort()).toEqual([...FIELD_TYPES].sort())
  })

  it("keeps options when switching between choice types", () => {
    const radio = field("single_choice", { options: options("A", "B") })
    const dropdown = changeFieldType(radio, "dropdown")
    expect(dropdown.id).toBe("f1")
    expect(dropdown.options?.map((o) => o.label)).toEqual(["A", "B"])
    expect(compatibleTypes("date")).toEqual(["date"])
  })
})

describe("required / optional", () => {
  it("rejects empty values for required fields", () => {
    for (const type of FIELD_TYPES) {
      const empty = type === "multiple_choice" ? [] : ""
      expect(check(field(type, { required: true }), empty)).toEqual({ ok: false, message: "This field is required" })
    }
  })

  it("accepts missing values for optional fields", () => {
    for (const type of FIELD_TYPES) expect(check(field(type), undefined)).toEqual({ ok: true, value: undefined })
  })

  it("strips unknown keys", () => {
    const r = buildZodSchema([field("short_text")]).parse({ f1: "hi", hacker: "x" })
    expect(r).toEqual({ f1: "hi" })
  })
})

describe("per-type validation", () => {
  it("short_text: trims and enforces max length", () => {
    expect(check(field("short_text"), "  Jane  ")).toEqual({ ok: true, value: "Jane" })
    expect(check(field("short_text"), "x".repeat(256)).ok).toBe(false)
    expect(check(field("short_text", { config: { maxLength: 5 } }), "123456").ok).toBe(false)
  })

  it("long_text: allows up to 5000 chars", () => {
    expect(check(field("long_text"), "x".repeat(5000)).ok).toBe(true)
    expect(check(field("long_text"), "x".repeat(5001)).ok).toBe(false)
  })

  it("email: validates and lowercases", () => {
    expect(check(field("email"), " Jane@Example.CO.KE ")).toEqual({ ok: true, value: "jane@example.co.ke" })
    expect(check(field("email"), "not-an-email").ok).toBe(false)
  })

  it("phone: normalizes Kenyan numbers to E.164", () => {
    expect(check(field("phone"), "0712 345 678")).toEqual({ ok: true, value: "+254712345678" })
    expect(check(field("phone"), "0812345678").ok).toBe(false)
  })

  it("number: parses KES strings and enforces min/max", () => {
    const f = field("number", { config: { min: 10, max: 5000, currency: "KES" } })
    expect(check(f, "KES 1,500")).toEqual({ ok: true, value: 1500 })
    expect(check(f, 2)).toEqual({ ok: false, message: "Must be at least 10" })
    expect(check(f, "9,999").ok).toBe(false)
    expect(check(f, "abc")).toEqual({ ok: false, message: "Enter a number" })
  })

  it("single_choice: value must be an option unless allowOther", () => {
    const f = field("single_choice", { options: options("Nairobi", "Mombasa") })
    expect(check(f, "Nairobi").ok).toBe(true)
    expect(check(f, "Kisumu").ok).toBe(false)
    expect(check({ ...f, config: { allowOther: true } }, "Kisumu").ok).toBe(true)
  })

  it("multiple_choice: all values must be options, respects min/max", () => {
    const f = field("multiple_choice", { options: options("AI", "Web", "Cloud"), config: { minSelect: 2, maxSelect: 2 } })
    expect(check(f, ["AI", "Web"])).toEqual({ ok: true, value: ["AI", "Web"] })
    expect(check(f, ["AI"]).ok).toBe(false)
    expect(check(f, ["AI", "Web", "Cloud"]).ok).toBe(false)
    expect(check(f, ["AI", "Blockchain"]).ok).toBe(false)
    expect(check(f, ["AI", "AI"]).ok).toBe(false)
  })

  it("dropdown: kenya_counties preset validates against all 47 counties", () => {
    const f = { ...createField("dropdown", "kenya_counties"), id: "f1" }
    expect(check(f, "Nairobi").ok).toBe(true)
    expect(check(f, "Murang'a").ok).toBe(true)
    expect(check(f, "Atlantis").ok).toBe(false)
  })

  it("date: ISO dates within min/max", () => {
    const f = field("date", { config: { minDate: "2026-01-01", maxDate: "2026-12-31" } })
    expect(check(f, "2026-06-15")).toEqual({ ok: true, value: "2026-06-15" })
    expect(check(f, "2026-02-30").ok).toBe(false)
    expect(check(f, "2025-12-31").ok).toBe(false)
    expect(check(f, "15/06/2026").ok).toBe(false)
  })

  it("yes_no: only yes or no", () => {
    expect(check(field("yes_no"), "yes").ok).toBe(true)
    expect(check(field("yes_no"), "maybe").ok).toBe(false)
  })

  it("file_upload: an upload id", () => {
    expect(check(field("file_upload"), "abc123").ok).toBe(true)
    expect(check(field("file_upload"), 42).ok).toBe(false)
  })
})
