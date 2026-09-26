import type { RemixiconComponentType } from "@remixicon/react"

import { createFromTemplate } from "@/app/(app)/forms/actions"
import { PendingSubmitButton } from "@/components/new-form/pending-submit-button"

// Template card (§8) — Design.md feature card with a "Use template" action.
export function TemplateCard({
  templateKey,
  title,
  description,
  icon: Icon,
  questions,
}: {
  templateKey: string
  title: string
  description: string
  icon: RemixiconComponentType
  questions: number
}) {
  return (
    <form action={createFromTemplate.bind(null, templateKey)} className="flex flex-col gap-6 rounded-card bg-surface p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="grid size-12 place-items-center rounded-[14px] bg-brand-tint">
          <Icon className="size-[22px] text-brand" aria-hidden />
        </div>
        <span className="text-[13px] font-semibold text-ink-muted">{questions} questions</span>
      </div>
      <div>
        <h3 className="h3">{title}</h3>
        <p className="mt-2 text-[15px]">{description}</p>
      </div>
      <PendingSubmitButton variant="outline" className="mt-auto w-full bg-surface" aria-label={`Use the ${title} template`} arrow>
        Use template
      </PendingSubmitButton>
    </form>
  )
}
