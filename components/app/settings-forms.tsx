"use client"

import * as React from "react"
import { RiDeleteBinLine, RiLoaderLine } from "@remixicon/react"
import { toast } from "sonner"

import { deleteAccount, updateProfile } from "@/app/(app)/settings/actions"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Pref = "NONE" | "EACH_SUBMISSION" | "DAILY_DIGEST"

const PREFS: { value: Pref; title: string; hint: string }[] = [
  { value: "EACH_SUBMISSION", title: "Every response", hint: "An email as soon as someone submits." },
  { value: "DAILY_DIGEST", title: "Daily digest", hint: "One summary each morning at 8am." },
  { value: "NONE", title: "No emails", hint: "Check responses in the dashboard." },
]

export function ProfileForm({ name, email, emailNotifications }: { name: string; email: string; emailNotifications: Pref }) {
  const [values, setValues] = React.useState({ name, emailNotifications })
  const [pending, startTransition] = React.useTransition()
  const id = React.useId()

  function save(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateProfile(values)
      if (res.ok) toast.success("Settings saved")
      else toast.error(res.error)
    })
  }

  return (
    <form method="post" onSubmit={save} className="flex flex-col gap-6 rounded-card bg-surface p-6 shadow-card sm:p-8">
      <div>
        <p className="eyebrow">Profile</p>
        <h2 className="h3 mt-3">Your details</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-name`} className="text-[13px] font-semibold">
            Name
          </Label>
          <Input id={`${id}-name`} className="h-11 bg-surface text-base" value={values.name} maxLength={100} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${id}-email`} className="text-[13px] font-semibold">
            Email
          </Label>
          <Input id={`${id}-email`} className="h-11 bg-bg/60 text-base" value={email} readOnly aria-readonly />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-[13px] font-semibold text-ink">Email me about new responses</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {PREFS.map((p) => (
            <label
              key={p.value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-input border px-4 py-3 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-brand",
                values.emailNotifications === p.value ? "border-brand bg-brand-tint" : "border-line hover:border-brand"
              )}
            >
              <input
                type="radio"
                name="emailNotifications"
                value={p.value}
                checked={values.emailNotifications === p.value}
                onChange={() => setValues((v) => ({ ...v, emailNotifications: p.value }))}
                className="sr-only"
              />
              <span className="text-[15px] font-semibold text-ink">{p.title}</span>
              <span className="text-[13px] text-ink-muted">{p.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" size="lg" className="self-start" disabled={pending}>
        {pending && <RiLoaderLine className="animate-spin" data-icon="inline-start" />}
        Save changes
      </Button>
    </form>
  )
}

export function DeleteAccount({ email }: { email: string }) {
  const [open, setOpen] = React.useState(false)
  const [confirm, setConfirm] = React.useState("")
  const [pending, startTransition] = React.useTransition()
  const id = React.useId()

  function remove() {
    startTransition(async () => {
      const res = await deleteAccount(confirm)
      if (res && !res.ok) toast.error(res.error)
    })
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-destructive/20 bg-surface p-6 shadow-card sm:p-8" aria-labelledby={`${id}-title`}>
      <div>
        <h2 id={`${id}-title`} className="h3">
          Delete account
        </h2>
        <p className="mt-2 text-[15px]">Permanently deletes your account, all your forms, responses and uploaded files.</p>
      </div>
      <Button variant="destructive" size="lg" className="self-start" onClick={() => setOpen(true)}>
        <RiDeleteBinLine data-icon="inline-start" /> Delete my account
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>This can’t be undone. Type {email} to confirm.</AlertDialogDescription>
          </AlertDialogHeader>
          <Label htmlFor={`${id}-confirm`} className="sr-only">
            Your email address
          </Label>
          <Input id={`${id}-confirm`} className="h-11 text-base" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={email} autoComplete="off" />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={remove} disabled={pending || confirm.trim().toLowerCase() !== email.toLowerCase()}>
              {pending && <RiLoaderLine className="animate-spin" data-icon="inline-start" />}
              Delete forever
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
