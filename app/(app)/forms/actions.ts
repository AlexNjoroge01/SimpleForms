"use server"

import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { after } from "next/server"

import { forms, uploads } from "@/db/schema"
import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { DEFAULT_FORM_SETTINGS } from "@/lib/fields/types"
import { deleteObjects } from "@/lib/storage"

export type ActionResult = { ok: true } | { ok: false; error: string }

const notFound: ActionResult = { ok: false, error: "Form not found." }

function ownedBy(formId: string, userId: string) {
  return and(eq(forms.id, formId), eq(forms.userId, userId))
}

export async function createBlankForm() {
  const user = await requireUser()
  const [form] = await db
    .insert(forms)
    .values({ userId: user.id, title: "Untitled form", fields: [], settings: DEFAULT_FORM_SETTINGS })
    .returning({ id: forms.id })
  redirect(`/forms/${form.id}/edit`)
}

export async function duplicateForm(formId: string): Promise<ActionResult> {
  const user = await requireUser()
  const source = await db.query.forms.findFirst({ where: ownedBy(formId, user.id) })
  if (!source) return notFound

  // A copy is always a fresh, unpublished draft.
  await db.insert(forms).values({
    userId: user.id,
    title: `${source.title} (copy)`.slice(0, 200),
    description: source.description,
    fields: source.fields,
    settings: source.settings,
  })
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function setFormClosed(formId: string, closed: boolean): Promise<ActionResult> {
  const user = await requireUser()
  const source = await db.query.forms.findFirst({
    where: ownedBy(formId, user.id),
    columns: { status: true },
  })
  if (!source) return notFound
  if (source.status === "DRAFT") return { ok: false, error: "Publish the form first." }

  await db
    .update(forms)
    .set({ status: closed ? "CLOSED" : "PUBLISHED" })
    .where(ownedBy(formId, user.id))
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function deleteForm(formId: string): Promise<ActionResult> {
  const user = await requireUser()
  const owned = await db.query.forms.findFirst({ where: ownedBy(formId, user.id), columns: { id: true } })
  if (!owned) return notFound

  // Rows cascade in Postgres; stored files must be removed from object storage.
  const keys = await db
    .select({ key: uploads.key })
    .from(uploads)
    .where(eq(uploads.formId, formId))
  await db.delete(forms).where(ownedBy(formId, user.id))
  if (keys.length) {
    after(() =>
      deleteObjects(keys.map((k) => k.key)).catch((err) => console.error("[storage] delete failed", err))
    )
  }

  revalidatePath("/dashboard")
  return { ok: true }
}
