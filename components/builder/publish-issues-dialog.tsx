"use client"

import { RiErrorWarningLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { PublishIssue } from "@/lib/fields/publish"

// Shown when publish validation (§9.6) fails. Clicking an issue selects that question.
export function PublishIssuesDialog({
  issues,
  onClose,
  onSelectField,
}: {
  issues: PublishIssue[]
  onClose: () => void
  onSelectField: (id: string) => void
}) {
  return (
    <Dialog open={issues.length > 0} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>A few things to fix first</DialogTitle>
          <DialogDescription>Your form can be published once these are sorted.</DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {issues.map((issue, i) => (
            <li key={i}>
              {issue.fieldId ? (
                <button
                  type="button"
                  onClick={() => onSelectField(issue.fieldId!)}
                  className="flex w-full items-start gap-2 rounded-input bg-bg px-3 py-2.5 text-left text-[14px] font-medium text-ink transition-colors hover:bg-brand-tint"
                >
                  <RiErrorWarningLine className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                  {issue.message}
                </button>
              ) : (
                <p className="flex items-start gap-2 rounded-input bg-bg px-3 py-2.5 text-[14px] font-medium text-ink">
                  <RiErrorWarningLine className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                  {issue.message}
                </p>
              )}
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button onClick={onClose}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
