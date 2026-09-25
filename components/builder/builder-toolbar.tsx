"use client"

import Link from "next/link"
import { RiArrowGoBackLine, RiArrowGoForwardLine, RiArrowLeftLine, RiCheckLine, RiErrorWarningLine, RiLoaderLine } from "@remixicon/react"

import type { SaveStatus } from "@/components/builder/use-autosave"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useBuilderStore } from "@/stores/builder-store"

const statusText: Record<SaveStatus, string> = {
  saved: "Saved",
  unsaved: "Unsaved changes",
  saving: "Saving…",
  error: "Not saved",
}

function SaveIndicator({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) {
  const icon = {
    saved: <RiCheckLine className="size-4 text-brand" />,
    unsaved: <span className="size-2 rounded-full bg-gold" />,
    saving: <RiLoaderLine className="size-4 animate-spin" />,
    error: <RiErrorWarningLine className="size-4 text-destructive" />,
  }[status]

  return (
    <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink-muted" role="status" aria-live="polite">
      {icon}
      <span className="sr-only sm:not-sr-only">{statusText[status]}</span>
      {status === "error" && (
        <button type="button" onClick={onRetry} className="font-semibold text-brand hover:underline">
          Retry
        </button>
      )}
    </span>
  )
}

export function BuilderToolbar({
  status,
  formStatus,
  onRetry,
}: {
  status: SaveStatus
  formStatus: "DRAFT" | "PUBLISHED" | "CLOSED"
  onRetry: () => void
}) {
  const canUndo = useBuilderStore((s) => s.past.length > 0)
  const canRedo = useBuilderStore((s) => s.future.length > 0)
  const undo = useBuilderStore((s) => s.undo)
  const redo = useBuilderStore((s) => s.redo)
  const title = useBuilderStore((s) => s.title)

  return (
    <div className="flex h-14 items-center gap-3 border-b border-line bg-surface/80 px-4 backdrop-blur">
      <Button asChild variant="ghost" size="icon-sm" aria-label="Back to forms">
        <Link href="/dashboard">
          <RiArrowLeftLine />
        </Link>
      </Button>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="truncate text-[15px] font-bold">{title || "Untitled form"}</span>
        <span className="hidden sm:inline-flex">
          <StatusBadge status={formStatus} />
        </span>
      </div>
      <SaveIndicator status={status} onRetry={onRetry} />
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={undo} disabled={!canUndo} aria-label="Undo">
              <RiArrowGoBackLine />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={redo} disabled={!canRedo} aria-label="Redo">
              <RiArrowGoForwardLine />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
