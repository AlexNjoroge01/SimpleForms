import Link from "next/link"
import { RiCompass3Line } from "@remixicon/react"

import { Logo } from "@/components/site/logo"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="container-site flex min-h-svh flex-col items-center justify-center gap-6 py-16 text-center">
      <Logo />
      <div className="flex flex-col items-center gap-4 rounded-card bg-surface p-10 shadow-card">
        <div className="grid size-12 place-items-center rounded-[14px] bg-brand-tint">
          <RiCompass3Line className="size-[22px] text-brand" aria-hidden />
        </div>
        <h1 className="h3">Page not found</h1>
        <p className="max-w-sm">This page doesn’t exist, or you don’t have access to it.</p>
        <Button asChild size="lg">
          <Link href="/dashboard">Go to your forms</Link>
        </Button>
      </div>
    </main>
  )
}
