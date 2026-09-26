import type { Metadata } from "next"
import { RiFileAddLine } from "@remixicon/react"

import { createBlankForm } from "@/app/(app)/forms/actions"
import { PendingSubmitButton } from "@/components/new-form/pending-submit-button"
import { TemplateCard } from "@/components/new-form/template-card"
import { CardGrid } from "@/components/site/cards"
import { TEMPLATES } from "@/lib/templates"

export const metadata: Metadata = { title: "New form" }

// Start blank or from one of the Kenyan templates.
export default function NewFormPage() {
  return (
    <div className="container-site flex flex-col gap-12 py-12">
      <div>
        <p className="eyebrow">New form</p>
        <h1 className="mt-3 text-[34px] leading-[1.05] font-bold tracking-[-0.03em]">How would you like to start?</h1>
      </div>

      <section
        aria-labelledby="blank-title"
        className="flex flex-col gap-6 rounded-card bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:p-8"
      >
        <div className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-brand-tint">
          <RiFileAddLine className="size-[22px] text-brand" aria-hidden />
        </div>
        <div className="flex-1">
          <h2 id="blank-title" className="h3">
            Blank form
          </h2>
          <p className="mt-2 text-[15px]">Start from scratch and add questions one by one.</p>
        </div>
        <form action={createBlankForm} className="sm:w-56">
          <PendingSubmitButton className="w-full">Start blank</PendingSubmitButton>
        </form>
      </section>

      <section aria-labelledby="templates-title" className="flex flex-col gap-6">
        <div>
          <p className="eyebrow">Templates</p>
          <h2 id="templates-title" className="mt-3 text-[26px] leading-tight font-bold tracking-[-0.02em]">
            Start from a Kenyan template
          </h2>
          <p className="mt-2 max-w-[620px]">Ready-made forms with local defaults. Everything can be edited after.</p>
        </div>
        <CardGrid>
          {TEMPLATES.map((t) => (
            <TemplateCard
              key={t.key}
              templateKey={t.key}
              title={t.title}
              description={t.description}
              icon={t.icon}
              questions={t.fields.length}
            />
          ))}
        </CardGrid>
      </section>
    </div>
  )
}
