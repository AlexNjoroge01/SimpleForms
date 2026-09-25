import Link from "next/link"

import { UserMenu } from "@/components/app/user-menu"
import { Logo } from "@/components/site/logo"
import { requireUser } from "@/lib/auth"

// Authed shell. proxy.ts redirects optimistically; this is the real check.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  return (
    <div className="min-h-svh">
      <header className="border-b border-line bg-surface/70 backdrop-blur">
        <div className="container-site flex h-16 items-center justify-between gap-4">
          <Logo />
          <nav className="flex items-center gap-4 text-[15px] font-medium">
            <Link href="/dashboard" className="text-ink-muted transition-colors hover:text-ink">
              Forms
            </Link>
            <UserMenu user={user} />
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
