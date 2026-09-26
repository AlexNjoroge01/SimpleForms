import type { RemixiconComponentType } from "@remixicon/react"

// Full-card message for thanks / closed / limit-reached states (§9.7).
export function FormStateMessage({
  icon: Icon,
  title,
  message,
  children,
}: {
  icon: RemixiconComponentType
  title: string
  message: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-(--pf-accent-tint)">
        <Icon className="size-7 text-(--pf-accent-fg)" aria-hidden />
      </div>
      <h1 className="text-[26px] leading-tight font-extrabold tracking-[-0.03em] text-(--pf-text)">{title}</h1>
      <p className="max-w-md text-[16px] whitespace-pre-line">{message}</p>
      {children}
    </div>
  )
}
