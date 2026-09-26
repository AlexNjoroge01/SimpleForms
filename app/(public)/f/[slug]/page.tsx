import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { RiLockLine, RiTeamLine } from "@remixicon/react"

import { loadPublicForm, metaDescription } from "@/app/(public)/f/[slug]/data"
import { FormStateMessage } from "@/components/public-form/form-state"
import { PublicForm, PublicFormShell } from "@/components/public-form/public-form"

type Props = { params: Promise<{ slug: string }> }

// Open Graph tags so WhatsApp / social previews show the form (§9.7, Phase 5).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const form = await loadPublicForm(slug)
  if (!form) return { title: "Form not found", robots: { index: false } }

  const description = metaDescription(form.description)
  return {
    title: { absolute: form.title },
    description,
    robots: { index: false, follow: false },
    openGraph: { title: form.title, description, type: "website", url: `/f/${slug}`, siteName: "SimpleForms" },
    twitter: { card: "summary_large_image", title: form.title, description },
  }
}

// Public form (§9.7): server-rendered shell, no auth. Only published data is read.
export default async function PublicFormPage({ params }: Props) {
  const { slug } = await params
  const form = await loadPublicForm(slug)
  if (!form) notFound()

  return (
    <PublicFormShell settings={form.settings}>
      {form.availability === "closed" ? (
        <FormStateMessage icon={RiLockLine} title={form.title} message="This form is no longer accepting responses." />
      ) : form.availability === "limit_reached" ? (
        <FormStateMessage
          icon={RiTeamLine}
          title={form.title}
          message="This form has reached its response limit and is no longer accepting responses."
        />
      ) : (
        <PublicForm
          slug={form.slug}
          form={{ title: form.title, description: form.description, fields: form.fields, settings: form.settings }}
        />
      )}
    </PublicFormShell>
  )
}
