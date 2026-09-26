import { cn } from "@/lib/utils"

// Daily sign-ups, single series (so no legend — the heading names it).
// Server-rendered: each bar is focusable and shows its tooltip on hover or
// focus with CSS only. Bars: 4px rounded tops on the baseline, 2px gaps; an
// empty day keeps a 2px stub so the time axis stays readable.

const dayLabel = new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", timeZone: "UTC" })

export function SignupChart({ data }: { data: { day: string; signups: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.signups))
  const total = data.reduce((sum, d) => sum + d.signups, 0)
  const label = (day: string) => dayLabel.format(new Date(`${day}T00:00:00Z`))

  return (
    <figure className="flex flex-col gap-4">
      <p className="text-[13px] font-semibold text-ink-muted tabular-nums">Peak {max} / day</p>
      <ol className="flex h-44 items-end gap-[2px] border-b border-line" aria-label={`Sign-ups per day, ${total} in total`}>
        {data.map((d, i) => (
          <li key={d.day} className="group relative flex h-full flex-1 items-end">
            <span
              tabIndex={0}
              aria-label={`${label(d.day)}: ${d.signups} sign-up${d.signups === 1 ? "" : "s"}`}
              className={
                d.signups
                  ? "block w-full rounded-t-[4px] bg-brand-bright transition-colors outline-none group-hover:bg-brand focus-visible:bg-brand"
                  : "block h-[2px] w-full bg-line outline-none focus-visible:bg-brand"
              }
              style={d.signups ? { height: `${(d.signups / max) * 100}%` } : undefined}
            />
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute bottom-full z-10 mb-2 hidden rounded-[8px] bg-ink px-2.5 py-1.5 text-[12px] font-semibold whitespace-nowrap text-white shadow-card group-focus-within:block group-hover:block",
                // Keep edge tooltips inside the card.
                i < 3 ? "left-0" : i > data.length - 4 ? "right-0" : "left-1/2 -translate-x-1/2"
              )}
            >
              {label(d.day)} · {d.signups}
            </span>
          </li>
        ))}
      </ol>
      <figcaption className="flex justify-between text-[12px] text-ink-muted">
        <span>{data[0] && label(data[0].day)}</span>
        <span>Today</span>
      </figcaption>
    </figure>
  )
}
