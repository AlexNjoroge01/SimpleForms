import Papa from "papaparse"
import { describe, expect, it } from "vitest"

import { csvCell, csvLine, exportFilename, guardCell, nairobiTimestamp } from "@/lib/csv"
import { createField } from "@/lib/fields/registry"
import type { Field, FieldType } from "@/lib/fields/types"

const f = (type: FieldType, patch: Partial<Field> = {}): Field => ({ ...createField(type), ...patch })

describe("CSV injection guard (§19)", () => {
  it.each(["=SUM(A1)", "+1+1", "-2+3", "@cmd", "\t=1", "\r=1"])("prefixes %j", (v) => {
    expect(guardCell(v)).toBe(`'${v}`)
  })
  it("leaves normal text alone", () => {
    expect(guardCell("Wanjiku")).toBe("Wanjiku")
    expect(guardCell("a=b")).toBe("a=b")
  })
  it("trusts validated phones and numbers", () => {
    expect(csvCell(f("phone"), "+254712345678")).toBe("+254712345678")
    expect(csvCell(f("number"), -50)).toBe("-50")
    expect(csvCell(f("short_text"), "-50")).toBe("'-50")
    expect(csvCell(f("short_text"), "=HYPERLINK(\"http://evil\")")).toBe("'=HYPERLINK(\"http://evil\")")
  })
})

describe("serialization per type (§11)", () => {
  it("uses registry formats", () => {
    expect(csvCell(f("multiple_choice"), ["AI", "Web"])).toBe("AI; Web")
    expect(csvCell(f("yes_no"), "yes")).toBe("Yes")
    expect(csvCell(f("yes_no"), "no")).toBe("No")
    expect(csvCell(f("number", { config: { currency: "KES" } }), 1500)).toBe("1500")
    expect(csvCell(f("date"), "2026-03-05")).toBe("2026-03-05")
    expect(csvCell(f("short_text"), undefined)).toBe("")
  })
  it("turns upload ids into URLs", () => {
    expect(csvCell(f("file_upload"), "up1", (id) => `https://x.test/api/files/${id}`)).toBe("https://x.test/api/files/up1")
  })
})

describe("csvLine", () => {
  it("quotes commas, quotes and newlines (RFC 4180) and round-trips", () => {
    const cells = ["plain", "a, b", 'say "hi"', "line1\nline2", "Ñairobi ✓"]
    const line = csvLine(cells)
    expect(line.endsWith("\r\n")).toBe(true)
    expect(Papa.parse<string[]>(line.trimEnd()).data[0]).toEqual(cells)
  })
})

describe("time + filename", () => {
  it("formats timestamps in Africa/Nairobi (UTC+3)", () => {
    expect(nairobiTimestamp(new Date("2026-03-05T21:30:05Z"))).toBe("2026-03-06 00:30:05")
  })
  it("builds {title-slug}-responses-{date}.csv", () => {
    expect(exportFilename("Harambee Registration 2026!", new Date("2026-03-05T22:00:00Z"))).toBe(
      "harambee-registration-2026-responses-2026-03-06.csv"
    )
  })
})
