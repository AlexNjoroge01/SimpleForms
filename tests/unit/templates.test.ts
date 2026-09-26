import { describe, expect, it } from "vitest"

import { assignIds } from "@/lib/fields/assign-ids"
import { buildZodSchema } from "@/lib/fields/build-zod-schema"
import { draftSchema } from "@/lib/fields/field-schema"
import { publishIssues } from "@/lib/fields/publish"
import { settingsSchema } from "@/lib/fields/settings"
import { DEFAULT_FORM_SETTINGS } from "@/lib/fields/types"
import { getTemplate, instantiateTemplate, TEMPLATES } from "@/lib/templates"

describe("templates (§8)", () => {
  it("has the ten Blueprint templates", () => {
    expect(TEMPLATES.map((t) => t.title)).toEqual([
      "Event registration",
      "Customer feedback",
      "Job application",
      "Order form",
      "Contact form",
      "School registration",
      "Service booking",
      "Employee information",
      "Product survey",
      "Lead generation",
    ])
    expect(new Set(TEMPLATES.map((t) => t.key)).size).toBe(10)
  })

  it.each(TEMPLATES.map((t) => [t.title, t] as const))("%s creates a valid, publishable draft", (_title, t) => {
    const fields = instantiateTemplate(t)
    expect(draftSchema.safeParse({ title: t.title, description: t.description, fields }).success).toBe(true)
    expect(publishIssues(t.title, fields)).toEqual([])
    expect(settingsSchema.safeParse({ ...DEFAULT_FORM_SETTINGS, ...t.settings }).success).toBe(true)
    // The answer schema builds for every field.
    expect(() => buildZodSchema(fields)).not.toThrow()
  })

  it("gives every copy fresh ids", () => {
    const t = getTemplate("event-registration")!
    const a = instantiateTemplate(t)
    const b = instantiateTemplate(t)
    expect(a.map((f) => f.id)).not.toEqual(b.map((f) => f.id))
    expect(new Set(a.map((f) => f.id)).size).toBe(a.length)
  })

  it("uses Kenyan defaults where the Blueprint asks", () => {
    const job = instantiateTemplate(getTemplate("job-application")!)
    expect(job.some((f) => f.type === "file_upload" && f.config?.accept === "pdf")).toBe(true)

    const order = instantiateTemplate(getTemplate("order-form")!)
    expect(order.some((f) => f.type === "number" && f.config?.currency === "KES")).toBe(true)
    expect(order.some((f) => f.config?.preset === "kenya_counties")).toBe(true)
    expect(order.some((f) => f.label === "Delivery notes")).toBe(true)

    const school = instantiateTemplate(getTemplate("school-registration")!)
    expect(school.some((f) => f.type === "phone" && /parent/i.test(f.label))).toBe(true)
    expect(school.some((f) => /class/i.test(f.label))).toBe(true)

    const booking = instantiateTemplate(getTemplate("service-booking")!)
    expect(booking.map((f) => f.type)).toEqual(expect.arrayContaining(["date", "single_choice", "phone"]))
  })
})

describe("assignIds", () => {
  it("keeps allowed ids and replaces missing, unknown or duplicate ones", () => {
    const fields = assignIds(
      [
        { id: "keepme", type: "short_text", label: "A", required: false },
        { id: "keepme", type: "short_text", label: "dup", required: false },
        { id: "invented", type: "email", label: "B", required: false },
        { type: "yes_no", label: "C", required: false },
        { id: "bad id!", type: "short_text", label: "D", required: false },
      ],
      new Set(["keepme"])
    )
    expect(fields[0].id).toBe("keepme")
    expect(new Set(fields.map((f) => f.id)).size).toBe(5)
    expect(fields[2].id).not.toBe("invented")
    expect(fields.every((f) => /^[a-z0-9]{1,32}$/i.test(f.id))).toBe(true)
  })

  it("assigns option ids", () => {
    const [f] = assignIds([{ type: "single_choice", label: "Q", required: false, options: [{ label: "A" }, { label: "B" }] }])
    expect(f.options?.every((o) => o.id)).toBe(true)
    expect(new Set(f.options?.map((o) => o.id)).size).toBe(2)
  })
})
