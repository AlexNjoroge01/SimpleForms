import Link from "next/link"

import { Logo } from "@/components/site/logo"

const columns = [
  {
    heading: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#templates", label: "Templates" },
      { href: "/signup", label: "Get started" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
  {
    heading: "Contact",
    links: [{ href: "mailto:hello@simpleforms.co.ke", label: "hello@simpleforms.co.ke" }],
  },
]

// Design.md §5 Footer.
export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-site grid gap-12 py-16 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="flex max-w-xs flex-col gap-4">
          <Logo />
          <p className="text-[15px]">Beautiful, AI-built forms for Kenya. Share by link or QR, export to CSV.</p>
        </div>
        {columns.map((col) => (
          <div key={col.heading} className="flex flex-col gap-4">
            <h2 className="text-[13px] font-bold tracking-[0.06em] text-ink uppercase">{col.heading}</h2>
            <ul className="flex flex-col gap-3">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[15px] text-ink-muted transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-site border-t border-line py-6">
        <p className="footnote">© {new Date().getFullYear()} SimpleForms. Made in Nairobi.</p>
      </div>
    </footer>
  )
}
