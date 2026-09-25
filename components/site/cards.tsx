import * as React from "react"
import Link from "next/link"
import type { RemixiconComponentType } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const cardBase = "rounded-card bg-surface p-8 text-ink shadow-card [&_p]:text-ink-muted"

// Design.md §5 Feature card.
export function FeatureCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: RemixiconComponentType
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(cardBase, className)}>
      <div className="grid size-12 place-items-center rounded-[14px] bg-brand-tint">
        <Icon className="size-[22px] text-brand" aria-hidden />
      </div>
      <h3 className="h3 mt-6">{title}</h3>
      <p className="mt-2">{children}</p>
    </div>
  )
}

// Design.md §5 Step card.
export function StepCard({
  step,
  title,
  children,
  className,
}: {
  step: number
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn(cardBase, className)}>
      <span className="step-number">{String(step).padStart(2, "0")}</span>
      <h3 className="h3 mt-3">{title}</h3>
      <p className="mt-2">{children}</p>
    </div>
  )
}

export function CardGrid({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)} {...props} />
}

// Design.md §5 CTA banner.
export function CTABanner({
  children,
  href,
  cta,
  className,
}: {
  children: React.ReactNode
  href: string
  cta: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-6 rounded-card px-8 py-10 shadow-float [background:var(--banner)] md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <p className="text-[17px] text-[#D6D8D4]">{children}</p>
      <Button asChild variant="inverse" size="lg" className="shrink-0">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  )
}
