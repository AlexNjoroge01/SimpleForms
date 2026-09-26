import "server-only"

import { cache } from "react"
import { connection } from "next/server"

import { getPublicForm } from "@/lib/public-forms"

/** Per-request (deduped between generateMetadata and the page), never prerendered. */
export const loadPublicForm = cache(async (slug: string) => {
  await connection()
  return getPublicForm(slug)
})

export function metaDescription(description: string | null | undefined) {
  const d = description?.trim()
  if (!d) return "Fill in this form — it takes a minute. Made with SimpleForms."
  return d.length > 200 ? `${d.slice(0, 197)}…` : d
}
