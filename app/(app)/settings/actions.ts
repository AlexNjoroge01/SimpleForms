"use server"

import { eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { z } from "zod"

import { forms, uploads, users } from "@/db/schema"
import { requireUser, signOut } from "@/lib/auth"
import { db } from "@/lib/db"
import { deleteObjects } from "@/lib/storage"

export type SettingsActionResult = { ok: true } | { ok: false; error: string }

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  emailNotifications: z.enum(["NONE", "EACH_SUBMISSION", "DAILY_DIGEST"]),
})

export async function updateProfile(input: unknown): Promise<SettingsActionResult> {
  const user = await requireUser()
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details." }
  await db.update(users).set(parsed.data).where(eq(users.id, user.id))
  revalidatePath("/", "layout")
  return { ok: true }
}

/** Deletes the account and everything it owns (§9.9). Requires typing the email. */
export async function deleteAccount(confirmEmail: string): Promise<SettingsActionResult> {
  const user = await requireUser()
  const row = await db.query.users.findFirst({ where: eq(users.id, user.id), columns: { email: true } })
  if (!row) return { ok: false, error: "Account not found." }
  if (confirmEmail.trim().toLowerCase() !== row.email.toLowerCase())
    return { ok: false, error: "Type your email address exactly to confirm." }

  const formIds = (await db.select({ id: forms.id }).from(forms).where(eq(forms.userId, user.id))).map((f) => f.id)
  const keys = formIds.length
    ? (await db.select({ key: uploads.key }).from(uploads).where(inArray(uploads.formId, formIds))).map((u) => u.key)
    : []

  // Forms, responses, uploads, accounts and sessions cascade from the user row.
  await db.delete(users).where(eq(users.id, user.id))
  if (keys.length) after(() => deleteObjects(keys).catch((err) => console.error("[storage] delete failed", err)))

  await signOut({ redirectTo: "/" })
  return { ok: true }
}
