import { describe, expect, it } from "vitest"

import { KENYA_COUNTIES } from "@/lib/kenya/counties"
import { formatAmountTyping, formatKES } from "@/lib/kenya/currency"
import { formatKenyanPhone, formatPhoneTyping, normalizeKenyanPhone } from "@/lib/kenya/phone"

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

describe("phone input formatting (§8)", () => {
  it.each([
    ["7", "7"],
    ["0712", "712"],
    ["0712345678", "712 345 678"],
    ["712345678999", "712 345 678"],
    ["+254 712 345 678", "712 345 678"],
    ["254712345678", "712 345 678"],
    ["0112-345-678", "112 345 678"],
    ["abc", ""],
  ])("%j → %j", (input, expected) => {
    expect(formatPhoneTyping(input)).toBe(expected)
  })

  it("formatted input normalizes to E.164", () => {
    expect(normalizeKenyanPhone(formatPhoneTyping("0712 345 678"))).toBe("+254712345678")
  })
})

describe("KES formatting (§8)", () => {
  it.each([
    ["1500", "1,500"],
    ["1500.5", "1,500.5"],
    ["1234567.891", "1,234,567.89"],
    ["12,34a5", "12,345"],
    ["007", "7"],
    ["1.2.3", "1.23"],
    ["", ""],
  ])("typing %j → %j", (input, expected) => {
    expect(formatAmountTyping(input)).toBe(expected)
  })

  it("keeps a minus only when allowed", () => {
    expect(formatAmountTyping("-50")).toBe("50")
    expect(formatAmountTyping("-50", { allowNegative: true })).toBe("-50")
  })

  it("formats display amounts", () => {
    expect(formatKES(1500)).toBe("KES 1,500")
    expect(formatKES(1500.5)).toBe("KES 1,500.5")
  })
})

describe("counties", () => {
  it("has all 47, alphabetical, unique", () => {
    expect(KENYA_COUNTIES).toHaveLength(47)
    expect([...KENYA_COUNTIES]).toEqual([...KENYA_COUNTIES].sort((a, b) => a.localeCompare(b)))
    expect(new Set(KENYA_COUNTIES).size).toBe(47)
  })
})
