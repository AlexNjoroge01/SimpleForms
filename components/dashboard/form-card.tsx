"use client"

import * as React from "react"
import Link from "next/link"
import {
  RiDeleteBinLine,
  RiFileCopyLine,
  RiLockLine,
  RiLockUnlockLine,
  RiMore2Fill,
  RiPencilLine,
} from "@remixicon/react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

import { deleteForm, duplicateForm, setFormClosed, type ActionResult } from "@/app/(app)/forms/actions"
import { StatusBadge } from "@/components/dashboard/status-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { FormListItem } from "@/lib/forms"

export function FormCard({ form }: { form: FormListItem }) {
  const [pending, startTransition] = React.useTransition()
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  function run(action: () => Promise<ActionResult>, success: string) {
    startTransition(async () => {
      const result = await action()
      if (result.ok) toast.success(success)
      else toast.error(result.error)
    })
  }

  const responses = `${form.responseCount.toLocaleString("en-KE")} ${form.responseCount === 1 ? "response" : "responses"}`

  return (
    <article
      className="group relative flex flex-col gap-6 rounded-card bg-surface p-6 shadow-card transition-transform duration-150 hover:-translate-y-px aria-busy:opacity-60"
      aria-busy={pending}
    >
      <div className="flex items-start justify-between gap-3">
        <StatusBadge status={form.status} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative z-10 -mt-1 -mr-2" aria-label={`Actions for ${form.title}`}>
              <RiMore2Fill />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href={`/forms/${form.id}/edit`}>
                <RiPencilLine /> Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => run(() => duplicateForm(form.id), "Form duplicated")}>
              <RiFileCopyLine /> Duplicate
            </DropdownMenuItem>
            {form.status !== "DRAFT" && (
              <DropdownMenuItem
                onSelect={() =>
                  run(
                    () => setFormClosed(form.id, form.status === "PUBLISHED"),
                    form.status === "PUBLISHED" ? "Form closed" : "Form reopened"
                  )
                }
              >
                {form.status === "PUBLISHED" ? <RiLockLine /> : <RiLockUnlockLine />}
                {form.status === "PUBLISHED" ? "Close" : "Reopen"}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
              <RiDeleteBinLine /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="min-w-0">
        <h2 className="h3 truncate">
          {/* Stretched link: whole card opens the builder */}
          <Link href={`/forms/${form.id}/edit`} className="outline-none after:absolute after:inset-0 after:rounded-card focus-visible:after:ring-2 focus-visible:after:ring-brand">
            {form.title}
          </Link>
        </h2>
        <p className="mt-2 text-[14px]">
          {responses} · Updated {formatDistanceToNow(form.updatedAt, { addSuffix: true })}
        </p>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{form.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the form and all {responses}. This can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => run(() => deleteForm(form.id), "Form deleted")}
            >
              Delete form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  )
}
