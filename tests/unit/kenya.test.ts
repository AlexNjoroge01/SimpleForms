import { describe, expect, it } from "vitest"

import { KENYA_COUNTIES } from "@/lib/kenya/counties"
import { formatKenyanPhone, normalizeKenyanPhone } from "@/lib/kenya/phone"

describe("normalizeKenyanPhone (Blueprint §8)", () => {
  it.each([
    ["0712345678", "+254712345678"],
    ["712345678", "+254712345678"],
    ["+254712345678", "+254712345678"],
    ["254712345678", "+254712345678"],
    ["0112345678", "+254112345678"],
    ["0712 345 678", "+254712345678"],
    ["0712-345-678", "+254712345678"],
    ["+254 (712) 345-678", "+254712345678"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeKenyanPhone(input)).toBe(expected)
  })

  it.each(["", "12345", "0812345678", "071234567", "07123456789", "+255712345678", "abc"])("rejects %j", (input) => {
    expect(normalizeKenyanPhone(input)).toBeNull()
  })

  it("formats for display", () => {
    expect(formatKenyanPhone("+254712345678")).toBe("+254 712 345 678")
  })
})

describe("counties", () => {
  it("has all 47, alphabetical, unique", () => {
    expect(KENYA_COUNTIES).toHaveLength(47)
    expect([...KENYA_COUNTIES]).toEqual([...KENYA_COUNTIES].sort((a, b) => a.localeCompare(b)))
    expect(new Set(KENYA_COUNTIES).size).toBe(47)
  })
})
