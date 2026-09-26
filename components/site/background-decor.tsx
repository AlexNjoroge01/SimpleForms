import { cn } from "@/lib/utils"

// Playful background layer: squiggles, a dot grid, a ring and a few sparkles in
// the brand tokens at low opacity. Fixed behind everything (-z-10) and inert.
// Surfaces that paint their own background (cards, DarkSection, public forms
// via `.pf`) simply cover it, so content never sits on top of a busy pattern.

const stroke = {
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

function Squiggle({ className, color = "var(--primary-bright)" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 320 60" className={className} {...stroke} stroke={color} strokeWidth={4}>
      <path d="M4 30 C 24 4, 44 4, 64 30 S 104 56, 124 30 S 164 4, 184 30 S 224 56, 244 30 S 284 4, 316 30" />
    </svg>
  )
}

function Zigzag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 32" className={className} {...stroke} stroke="var(--primary)" strokeWidth={3}>
      <path d="M4 26 L22 6 L40 26 L58 6 L76 26 L94 6 L116 26" />
    </svg>
  )
}

function Sparkle({ className, color = "var(--primary-bright)" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={color}>
      <path d="M12 0c.6 5.6 3.4 8.9 12 12-8.6 3.1-11.4 6.4-12 12-.6-5.6-3.4-8.9-12-12C8.6 8.9 11.4 5.6 12 0Z" />
    </svg>
  )
}

function DotGrid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="var(--primary)">
      <defs>
        <pattern id="bg-decor-dots" width="15" height="15" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="2" />
        </pattern>
      </defs>
      <rect width="120" height="120" fill="url(#bg-decor-dots)" />
    </svg>
  )
}

function Ring({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} {...stroke} stroke="var(--primary-bright)">
      <circle cx="100" cy="100" r="90" strokeWidth={3} strokeDasharray="2 12" />
      <circle cx="100" cy="100" r="62" strokeWidth={3} />
    </svg>
  )
}

export function BackgroundDecor({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}>
      {/* top right */}
      <Squiggle className="absolute -top-5 -right-16 w-[260px] rotate-[-8deg] opacity-25 md:w-[380px]" />
      <Sparkle className="absolute top-24 right-[12%] size-5 opacity-50 md:size-6" />
      <DotGrid className="absolute top-40 -right-6 hidden w-32 opacity-15 md:block" />

      {/* left + right edges */}
      <Ring className="absolute top-[42%] -left-32 w-56 opacity-20 md:-left-40 md:w-72" />
      <Sparkle className="absolute top-[30%] left-[6%] hidden size-4 opacity-60 md:block" color="var(--gold)" />
      <Zigzag className="absolute top-[58%] right-[2%] hidden w-20 rotate-[-12deg] opacity-20 md:block" />

      {/* bottom */}
      <Squiggle className="absolute -bottom-3 left-[18%] w-[240px] rotate-[4deg] opacity-20 md:w-[340px]" color="var(--primary)" />
      <DotGrid className="absolute right-[8%] bottom-10 w-24 opacity-15" />
      <Sparkle className="absolute right-[22%] bottom-[18%] hidden size-3 opacity-50 md:block" />
    </div>
  )
}
