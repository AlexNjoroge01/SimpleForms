import Link from "next/link"
import { RiArrowLeftLine } from "@remixicon/react"

import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Tab = "edit" | "share" | "responses"

const tabs: { key: Tab; label: string; href: (id: string) => string }[] = [
  { key: "edit", label: "Edit", href: (id) => `/forms/${id}/edit` },
  { key: "share", label: "Share", href: (id) => `/forms/${id}/share` },
  { key: "responses", label: "Responses", href: (id) => `/forms/${id}/responses` },
]

// Header for a form's share / responses pages: back, title, status, section tabs.
export function FormNav({
  form,
  active,
}: {
  form: { id: string; title: string; status: "DRAFT" | "PUBLISHED" | "CLOSED" }
  active: Tab
}) {
  return (
    <div className="border-b border-line bg-surface/60">
      <div className="container-site flex flex-col gap-3 pt-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon-sm" aria-label="Back to forms" className="-ml-2">
            <Link href="/dashboard">
              <RiArrowLeftLine />
            </Link>
          </Button>
          <h1 className="min-w-0 truncate text-[22px] leading-tight font-bold tracking-[-0.02em]">{form.title}</h1>
          <StatusBadge status={form.status} />
        </div>
        <nav aria-label="Form sections" className="-mb-px flex gap-6">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href(form.id)}
              aria-current={active === t.key ? "page" : undefined}
              className={cn(
                "border-b-2 pb-3 text-[15px] font-semibold transition-colors",
                active === t.key ? "border-brand text-ink" : "border-transparent text-ink-muted hover:text-ink"
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
