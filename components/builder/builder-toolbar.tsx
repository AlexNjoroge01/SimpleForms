"use client"

import Link from "next/link"
import {
  RiArrowGoBackLine,
  RiArrowGoForwardLine,
  RiArrowLeftLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiEyeLine,
  RiLoaderLine,
  RiMore2Fill,
  RiRocketLine,
  RiSettings3Line,
  RiShareLine,
} from "@remixicon/react"

import type { SaveStatus } from "@/components/builder/use-autosave"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
      <span className="sr-only md:not-sr-only">{statusText[status]}</span>
      {status === "error" && (
        <button type="button" onClick={onRetry} className="font-semibold text-brand hover:underline">
          Retry
        </button>
      )}
    </span>
  )
}

function IconAction({ label, onClick, href, disabled, children }: { label: string; onClick?: () => void; href?: string; disabled?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild={!!href} variant="ghost" size="icon-sm" onClick={onClick} disabled={disabled} aria-label={label}>
          {href ? <Link href={href}>{children}</Link> : children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export type PublishState = {
  formStatus: "DRAFT" | "PUBLISHED" | "CLOSED"
  hasUnpublishedChanges: boolean
  publishing: boolean
}

export function BuilderToolbar({
  formId,
  status,
  onRetry,
  publish,
  onPublish,
  onPreview,
  onSettings,
}: {
  formId: string
  status: SaveStatus
  onRetry: () => void
  publish: PublishState
  onPublish: () => void
  onPreview: () => void
  onSettings: () => void
}) {
  const canUndo = useBuilderStore((s) => s.past.length > 0)
  const canRedo = useBuilderStore((s) => s.future.length > 0)
  const undo = useBuilderStore((s) => s.undo)
  const redo = useBuilderStore((s) => s.redo)
  const title = useBuilderStore((s) => s.title)

  const isLive = publish.formStatus !== "DRAFT"
  const publishLabel = !isLive ? "Publish" : publish.hasUnpublishedChanges ? "Publish changes" : "Published"

  return (
    <div className="flex h-14 items-center gap-2 border-b border-line bg-surface/80 px-3 backdrop-blur sm:gap-3 sm:px-4">
      <Button asChild variant="ghost" size="icon-sm" aria-label="Back to forms">
        <Link href="/dashboard">
          <RiArrowLeftLine />
        </Link>
      </Button>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="truncate text-[15px] font-bold">{title || "Untitled form"}</span>
        <span className="hidden lg:inline-flex">
          <StatusBadge status={publish.formStatus} />
        </span>
      </div>
      <SaveIndicator status={status} onRetry={onRetry} />

      {/* ≥sm: inline actions */}
      <div className="hidden items-center gap-1 sm:flex">
        <IconAction label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
          <RiArrowGoBackLine />
        </IconAction>
        <IconAction label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>
          <RiArrowGoForwardLine />
        </IconAction>
        <IconAction label="Form settings" onClick={onSettings}>
          <RiSettings3Line />
        </IconAction>
        {isLive && (
          <IconAction label="Share" href={`/forms/${formId}/share`}>
            <RiShareLine />
          </IconAction>
        )}
        <Button variant="outline" size="sm" className="ml-1 bg-surface" onClick={onPreview}>
          <RiEyeLine data-icon="inline-start" /> Preview
        </Button>
      </div>

      {/* <sm: overflow menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="sm:hidden" aria-label="More actions">
            <RiMore2Fill />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={undo} disabled={!canUndo}>
            <RiArrowGoBackLine /> Undo
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={redo} disabled={!canRedo}>
            <RiArrowGoForwardLine /> Redo
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onPreview}>
            <RiEyeLine /> Preview
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onSettings}>
            <RiSettings3Line /> Settings
          </DropdownMenuItem>
          {isLive && (
            <DropdownMenuItem asChild>
              <Link href={`/forms/${formId}/share`}>
                <RiShareLine /> Share
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        size="sm"
        onClick={onPublish}
        disabled={publish.publishing || (isLive && !publish.hasUnpublishedChanges)}
        className="px-3 sm:px-4"
      >
        {publish.publishing ? (
          <RiLoaderLine className="animate-spin" data-icon="inline-start" />
        ) : isLive && !publish.hasUnpublishedChanges ? (
          <RiCheckLine data-icon="inline-start" />
        ) : (
          <RiRocketLine data-icon="inline-start" />
        )}
        <span className="max-[380px]:sr-only">{publishLabel}</span>
      </Button>
    </div>
  )
}
