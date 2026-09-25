import * as React from "react"

import { cn } from "@/lib/utils"

// Design.md §5 Stepper / progress bar (dark).
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div>
      <p className="form-label text-dark-subtle!">
        Step {current} of {steps.length}
      </p>
      <div
        className="mt-4 h-[3px] w-full bg-dark-panel"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={steps.length}
        aria-valuenow={current}
      >
        <div
          className="h-full [background:var(--progress)] transition-[width] duration-150"
          style={{ width: `${(current / steps.length) * 100}%` }}
        />
      </div>
      <ol className="mt-3 flex justify-between">
        {steps.map((s, i) => (
          <li
            key={s}
            className={cn(
              "text-xs font-bold tracking-[0.14em] uppercase",
              i + 1 <= current ? "text-neon" : "text-dark-subtle"
            )}
          >
            {s}
          </li>
        ))}
      </ol>
    </div>
  )
}

// Design.md §5 Form panel (dark).
export function DarkPanel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-card border border-dark-border bg-dark-panel p-6", className)}
      {...props}
    />
  )
}

export function DarkField({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="form-label">
        {label}
      </label>
      {children}
    </div>
  )
}

export function DarkInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-[50px] w-full rounded-input border border-dark-border bg-dark-input px-4 text-base text-dark-text transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-dark-subtle focus:border-neon focus:shadow-[0_0_0_3px_rgba(1,229,169,0.15)] focus-visible:outline-none",
        className
      )}
      {...props}
    />
  )
}
