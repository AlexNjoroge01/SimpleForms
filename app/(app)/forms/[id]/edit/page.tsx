import type { Metadata } from "next"

import { Builder } from "@/components/builder/builder"
import { getMyFormOr404 } from "@/lib/forms"

export const metadata: Metadata = { title: "Edit form" }

export default async function EditFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const form = await getMyFormOr404(id)

  return (
    <Builder
      key={form.id}
      form={{ id: form.id, title: form.title, description: form.description, fields: form.fields, status: form.status }}
    />
  )
}
