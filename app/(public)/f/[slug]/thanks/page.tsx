import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { RiCheckboxCircleLine } from "@remixicon/react"

import { loadPublicForm } from "@/app/(public)/f/[slug]/data"
import { FormStateMessage } from "@/components/public-form/form-state"
import { PublicFormShell } from "@/components/public-form/public-form"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const form = await loadPublicForm(slug)
  return { title: form ? `Thank you · ${form.title}` : "Thank you", robots: { index: false } }
}

// Confirmation page with the creator's custom success message (§9.7).
export default async function ThanksPage({ params }: Props) {
  const { slug } = await params
  const form = await loadPublicForm(slug)
  if (!form) notFound()

  return (
    <PublicFormShell settings={form.settings}>
      <FormStateMessage icon={RiCheckboxCircleLine} title="Response sent" message={form.settings.successMessage}>
        {form.availability === "open" && (
          <Link
            href={`/f/${form.slug}`}
            className="mt-2 text-[15px] font-semibold text-(--pf-accent-fg) underline-offset-4 hover:underline"
          >
            Submit another response
          </Link>
        )}
      </FormStateMessage>
    </PublicFormShell>
  )
}
