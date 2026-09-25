import type { Metadata } from "next"
import { RiFileList3Line } from "@remixicon/react"

import { FormCard } from "@/components/dashboard/form-card"
import { NewFormButton } from "@/components/dashboard/new-form-button"
import { CardGrid } from "@/components/site/cards"
import { listMyForms } from "@/lib/forms"

export const metadata: Metadata = { title: "Your forms" }

export default async function DashboardPage() {
  const forms = await listMyForms()

  return (
    <div className="container-site flex flex-col gap-8 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-3 text-[34px] leading-[1.05] font-bold tracking-[-0.03em]">Your forms</h1>
        </div>
        {forms.length > 0 && <NewFormButton />}
      </div>

      {forms.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-card bg-surface p-12 text-center shadow-card">
          <div className="grid size-12 place-items-center rounded-[14px] bg-brand-tint">
            <RiFileList3Line className="size-[22px] text-brand" aria-hidden />
          </div>
          <h2 className="h3">Create your first form</h2>
          <p className="max-w-sm">
            Start with a blank form. Soon you’ll also be able to describe it to AI or pick one of ten
            Kenyan templates.
          </p>
          <NewFormButton label="Create a form" />
        </div>
      ) : (
        <CardGrid>
          {forms.map((form) => (
            <FormCard key={form.id} form={form} />
          ))}
        </CardGrid>
      )}
    </div>
  )
}
