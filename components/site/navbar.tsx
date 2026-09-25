"use client"

import * as React from "react"
import Link from "next/link"
import { RiMenuLine } from "@remixicon/react"

import { Logo } from "@/components/site/logo"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#templates", label: "Templates" },
]

// Design.md §5 Navbar: transparent, 72px, logo left / links center / auth right.
export function Navbar({ onDark = false }: { onDark?: boolean }) {
  const [open, setOpen] = React.useState(false)
  const linkClass = cn(
    "text-[15px] font-medium transition-colors duration-150",
    onDark ? "text-dark-muted hover:text-dark-text" : "text-ink-muted hover:text-ink"
  )

  return (
    <header className="relative z-20">
      <nav className="container-site flex h-[72px] items-center justify-between gap-4">
        <Logo onDark={onDark} />

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className={linkClass}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" className={cn("h-10 px-4", onDark && "text-dark-text hover:bg-dark-panel")}>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild variant={onDark ? "inverse" : "default"} className="h-10 px-5">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("md:hidden", onDark && "text-dark-text hover:bg-dark-panel")}
              aria-label="Open menu"
            >
              <RiMenuLine />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-surface p-6">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <ul className="mt-8 flex flex-col gap-4">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[17px] font-semibold text-ink" onClick={() => setOpen(false)}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-3">
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="lg">
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
