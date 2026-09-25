import Link from "next/link"
import { RiFileList3Fill } from "@remixicon/react"

import { cn } from "@/lib/utils"

export function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 rounded-pill text-[17px] font-extrabold tracking-[-0.02em]",
        onDark ? "text-dark-text" : "text-ink",
        className
      )}
    >
      <span className="grid size-8 place-items-center rounded-[10px] bg-brand text-white">
        <RiFileList3Fill className="size-[18px]" aria-hidden />
      </span>
      SimpleForms
    </Link>
  )
}
