"use client"

import * as React from "react"
import Link from "next/link"
import { RiArrowLeftLine, RiComputerLine, RiEyeLine, RiSmartphoneLine } from "@remixicon/react"

import { PublicForm, PublicFormShell, type PublicFormData } from "@/components/public-form/public-form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Width = "mobile" | "desktop"

// Preview (§9.5): the exact public component with the draft, a banner, and a width toggle.
export function PreviewFrame({ formId, form }: { formId: string; form: PublicFormData }) {
  const [width, setWidth] = React.useState<Width>("mobile")

  return (
    <div className="flex min-h-[calc(100svh-64px)] flex-col">
      <div className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/forms/${formId}/edit`}>
              <RiArrowLeftLine data-icon="inline-start" /> <span className="hidden sm:inline">Back to editor</span>
              <span className="sm:hidden">Edit</span>
            </Link>
          </Button>
          <p className="flex min-w-0 flex-1 items-center gap-2 text-[14px] font-semibold text-ink" role="status">
            <RiEyeLine className="size-4 shrink-0 text-brand" aria-hidden />
            <span className="truncate">Preview — submissions disabled</span>
          </p>
          <div role="radiogroup" aria-label="Preview width" className="flex rounded-pill bg-line p-1">
            {(
              [
                ["mobile", RiSmartphoneLine, "Mobile"],
                ["desktop", RiComputerLine, "Desktop"],
              ] as const
            ).map(([w, Icon, label]) => (
              <button
                key={w}
                type="button"
                role="radio"
                aria-checked={width === w}
                aria-label={label}
                onClick={() => setWidth(w)}
                className={cn(
                  "grid h-8 w-10 place-items-center rounded-pill text-ink-muted transition-colors",
                  width === w && "bg-surface text-ink shadow-sm"
                )}
              >
                <Icon className="size-4" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 px-0 py-0 sm:px-4 sm:py-8">
        <div
          className={cn(
            "mx-auto overflow-hidden transition-[max-width] duration-150",
            width === "mobile" ? "max-w-[390px] sm:rounded-card sm:shadow-float sm:ring-8 sm:ring-dark" : "max-w-full"
          )}
        >
          <PublicFormShell settings={form.settings} className="min-h-[720px]">
            <PublicForm form={form} mode="preview" />
          </PublicFormShell>
        </div>
      </div>
    </div>
  )
}
