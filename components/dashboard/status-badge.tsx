import { cn } from "@/lib/utils"

type Status = "DRAFT" | "PUBLISHED" | "CLOSED"

const styles: Record<Status, string> = {
  DRAFT: "bg-line text-ink-muted",
  PUBLISHED: "bg-brand-tint text-brand",
  CLOSED: "bg-gold/15 text-[#8A5A12]", // derived: darkened --gold for AA contrast on tint
}

const labels: Record<Status, string> = { DRAFT: "Draft", PUBLISHED: "Live", CLOSED: "Closed" }

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-pill px-2.5 text-xs font-bold tracking-[0.06em] uppercase",
        styles[status]
      )}
    >
      {status === "PUBLISHED" && <span className="size-1.5 rounded-full bg-brand-bright" aria-hidden />}
      {labels[status]}
    </span>
  )
}
