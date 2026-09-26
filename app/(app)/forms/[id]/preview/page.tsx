import type { Metadata } from "next"

import { PreviewFrame } from "@/components/public-form/preview-frame"
import { resolveSettings } from "@/lib/fields/settings"
import { getMyFormOr404 } from "@/lib/forms"

export const metadata: Metadata = { title: "Preview" }

// Renders the saved draft (not the published snapshot) — §9.5.
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const form = await getMyFormOr404(id)

  return (
    <PreviewFrame
      formId={form.id}
      form={{
        title: form.title,
        description: form.description,
        fields: form.fields,
        settings: resolveSettings(form.settings),
      }}
    />
  )
}
