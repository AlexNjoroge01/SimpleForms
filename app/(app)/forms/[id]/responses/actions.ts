"use server"

import { and, eq, inArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { after } from "next/server"

import { forms, responses } from "@/db/schema"
import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { uploadKeysForResponses } from "@/lib/responses/query"
import { deleteObjects } from "@/lib/storage"

export type DeleteResult = { ok: true; deleted: number } | { ok: false; error: string }

const MAX_BATCH = 500

/** Deletes responses (single or bulk) and decrements responseCount (§9.8). */
export async function deleteResponses(formId: string, ids: string[]): Promise<DeleteResult> {
  const user = await requireUser()
  const unique = [...new Set(ids.filter((id) => typeof id === "string" && id.length <= 64))].slice(0, MAX_BATCH)
  if (!unique.length) return { ok: false, error: "Nothing selected." }

  const owned = await db.query.forms.findFirst({
    where: and(eq(forms.id, formId), eq(forms.userId, user.id)),
    columns: { id: true },
  })
  if (!owned) return { ok: false, error: "Form not found." }

  const keys = await uploadKeysForResponses(formId, unique)
  const deleted = await db.transaction(async (tx) => {
    const rows = await tx
      .delete(responses)
      .where(and(eq(responses.formId, formId), inArray(responses.id, unique)))
      .returning({ id: responses.id })
    if (rows.length) {
      await tx
        .update(forms)
        .set({ responseCount: sql`greatest(0, ${forms.responseCount} - ${rows.length})`, updatedAt: sql`${forms.updatedAt}` })
        .where(eq(forms.id, formId))
    }
    return rows.length
  })

  // Upload rows cascade with the response; the stored objects must go too.
  if (keys.length) {
    after(() => deleteObjects(keys.map((k) => k.key)).catch((err) => console.error("[storage] delete failed", err)))
  }
  revalidatePath("/dashboard")
  return { ok: true, deleted }
}
