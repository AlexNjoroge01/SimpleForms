"use client"

import Link from "next/link"
import { RiDashboard3Line, RiLogoutBoxRLine, RiSettings3Line } from "@remixicon/react"

import { signOutAction } from "@/app/(app)/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function initials(name?: string | null, email?: string | null) {
  const src = name?.trim() || email || "?"
  return src
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

export function UserMenu({
  user,
  isAdmin = false,
}: {
  user: { name?: string | null; email?: string | null; image?: string | null }
  isAdmin?: boolean
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
          <Avatar className="size-9">
            {user.image && <AvatarImage src={user.image} alt="" />}
            <AvatarFallback className="bg-brand-tint text-[13px] font-bold text-brand">
              {initials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-bold text-ink">{user.name ?? "Your account"}</span>
          <span className="truncate text-[13px] font-normal text-ink-muted">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <RiSettings3Line /> Settings
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <RiDashboard3Line /> Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => signOutAction()}>
          <RiLogoutBoxRLine /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
