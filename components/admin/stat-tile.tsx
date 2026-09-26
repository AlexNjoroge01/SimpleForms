import type { RemixiconComponentType } from "@remixicon/react"

const number = new Intl.NumberFormat("en-KE")

// Headline number + one line of context. Text stays in ink tokens; the icon
// tile carries the brand colour.
export function StatTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: RemixiconComponentType
  label: string
  value: number
  detail?: string
}) {
  return (
    <div className="flex flex-col gap-4 rounded-card bg-surface p-6 shadow-card">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-brand-tint">
          <Icon className="size-5 text-brand" aria-hidden />
        </div>
        <p className="text-[14px] font-semibold text-ink-muted">{label}</p>
      </div>
      <p className="text-[36px] leading-none font-extrabold tracking-[-0.03em] text-ink tabular-nums">
        {number.format(value)}
      </p>
      {detail && <p className="footnote">{detail}</p>}
    </div>
  )
}
