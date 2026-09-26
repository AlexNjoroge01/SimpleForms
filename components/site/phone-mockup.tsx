import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react"

// Static "live example" of a public form on a phone (§9.1). Server-rendered,
// no JS — it mirrors the real public form's styling.
export function PhoneMockup() {
  return (
    <div
      className="relative mx-auto w-full max-w-[320px] rounded-[44px] bg-dark p-3 shadow-float ring-1 ring-dark-border"
      role="img"
      aria-label="Example: a Harambee registration form on a phone, with name, +254 phone, county and ticket questions"
    >
      <div className="absolute top-3 left-1/2 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-dark" aria-hidden />
      <div className="overflow-hidden rounded-[34px] [background:var(--bg-gradient)]" aria-hidden>
        <div className="px-4 pt-10 pb-6">
          <div className="rounded-card bg-surface p-5 shadow-card">
            <p className="text-[20px] leading-tight font-extrabold tracking-[-0.03em] text-ink">Harambee Registration</p>
            <p className="mt-1 text-[12px]">Saturday 14th · Kasarani Community Hall</p>

            <p className="mt-5 text-[13px] font-bold text-ink">
              Full name <span className="text-destructive">*</span>
            </p>
            <div className="mt-2 flex h-10 items-center rounded-input border border-line px-3 text-[13px] text-ink">Achieng Otieno</div>

            <p className="mt-4 text-[13px] font-bold text-ink">
              Phone number <span className="text-destructive">*</span>
            </p>
            <div className="mt-2 flex gap-1.5">
              <span className="flex h-10 items-center rounded-input bg-brand-tint px-2 text-[12px] font-semibold text-ink">🇰🇪 +254</span>
              <span className="flex h-10 flex-1 items-center rounded-input border border-line px-3 text-[13px] text-ink">712 345 678</span>
            </div>

            <p className="mt-4 text-[13px] font-bold text-ink">County</p>
            <div className="mt-2 flex h-10 items-center justify-between rounded-input border border-line px-3 text-[13px] text-ink">
              Nairobi <RiArrowDownSLine className="size-4 text-ink-muted" />
            </div>

            <p className="mt-4 text-[13px] font-bold text-ink">Pledge</p>
            <div className="mt-2 grid gap-1.5">
              {["KES 1,000", "KES 5,000", "KES 10,000"].map((l, i) => (
                <div
                  key={l}
                  className={
                    i === 1
                      ? "flex h-10 items-center gap-2 rounded-input border border-brand bg-brand-tint px-3 text-[13px] text-ink"
                      : "flex h-10 items-center gap-2 rounded-input border border-line px-3 text-[13px] text-ink"
                  }
                >
                  <span className={i === 1 ? "grid size-4 place-items-center rounded-full bg-brand text-white" : "size-4 rounded-full border-2 border-line"}>
                    {i === 1 && <RiCheckLine className="size-3" />}
                  </span>
                  {l}
                </div>
              ))}
            </div>

            <div className="mt-5 grid h-11 place-items-center rounded-pill bg-brand text-[14px] font-bold text-white">Register</div>
          </div>
        </div>
      </div>
    </div>
  )
}
