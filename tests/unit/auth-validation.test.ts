import { describe, expect, it } from "vitest"

import { loginSchema, signupSchema } from "@/lib/validation/auth"

describe("auth validation", () => {
  it("normalizes email to trimmed lowercase", () => {
    const r = loginSchema.parse({ email: "  Wanjiku@Example.CO.KE ", password: "x" })
    expect(r.email).toBe("wanjiku@example.co.ke")
  })

  it("rejects short passwords and names on signup", () => {
    const r = signupSchema.safeParse({ name: "A", email: "a@b.co", password: "short" })
    expect(r.success).toBe(false)
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(["name", "password"])
  })

  it("caps passwords at bcrypt's 72-byte limit", () => {
    const r = signupSchema.safeParse({ name: "John Kamau", email: "j@k.co", password: "x".repeat(73) })
    expect(r.success).toBe(false)
  })
})
