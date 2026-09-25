import * as React from "react"

import { cn } from "@/lib/utils"

// Design.md §3 rule: every section heading gets an eyebrow + optional intro.
export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  as: Heading = "h2",
  className,
}: {
  eyebrow: string
  title: React.ReactNode
  intro?: React.ReactNode
  align?: "left" | "center"
  as?: "h1" | "h2"
  className?: string
}) {
  return (
    <div className={cn("flex flex-col", align === "center" && "items-center text-center", className)}>
      <p className="eyebrow">{eyebrow}</p>
      <Heading className={cn("mt-4", Heading === "h1" ? "h1" : "h2")}>{title}</Heading>
      {intro && <p className="body-lg mt-4 max-w-[620px]">{intro}</p>}
    </div>
  )
}

export function Section({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("section-y", className)} {...props} />
}

// Design.md §5 Dark section: radial green glow, optional dot grid.
export function DarkSection({
  className,
  inset = false,
  dots = true,
  children,
  ...props
}: React.ComponentProps<"section"> & { inset?: boolean; dots?: boolean }) {
  return (
    <section
      className={cn(
        "on-dark relative overflow-hidden [background:var(--dark-section)]",
        inset ? "rounded-section" : "rounded-t-section",
        className
      )}
      {...props}
    >
      {dots && <div aria-hidden className="dot-grid pointer-events-none absolute inset-0" />}
      <div className="relative">{children}</div>
    </section>
  )
}
