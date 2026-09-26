"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { RiLoaderLine } from "@remixicon/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { resetPasswordAction } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth"

const fields = [
  { name: "password", label: "New password", placeholder: "At least 8 characters" },
  { name: "confirm", label: "Confirm new password", placeholder: "Type it again" },
] as const

export function ResetPasswordForm({ email, token }: { email: string; token: string }) {
  const [pending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string>()

  const form = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema), mode: "onBlur" })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(undefined)
    startTransition(async () => {
      // Success signs in and redirects; only errors come back.
      const result = await resetPasswordAction(values, { email, token })
      if (result?.error) {
        setServerError(result.error)
        toast.error(result.error)
      }
    })
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="h3">Choose a new password</h1>
        <p className="mt-2">
          For <span className="font-semibold text-ink">{email}</span>. You’ll be logged in straight after.
        </p>
      </div>

      <form method="post" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {/* Lets password managers attach the new password to the right account. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        {fields.map((f) => {
          const error = form.formState.errors[f.name]?.message
          const errorId = `${f.name}-error`
          return (
            <div key={f.name} className="flex flex-col gap-2">
              <Label htmlFor={f.name} className="text-[14px] font-semibold text-ink">
                {f.label}
              </Label>
              <Input
                id={f.name}
                type="password"
                autoComplete="new-password"
                placeholder={f.placeholder}
                className="h-12 bg-surface px-4 text-base"
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                {...form.register(f.name)}
              />
              {error && (
                <p id={errorId} className="text-[13px] text-destructive">
                  {error}
                </p>
              )}
            </div>
          )
        })}

        <p aria-live="polite" className="text-[14px] text-destructive empty:hidden">
          {serverError}
          {serverError?.includes("Request a new one") && (
            <>
              {" "}
              <Link href="/forgot-password" className="font-semibold text-brand hover:underline">
                Send a new link
              </Link>
            </>
          )}
        </p>

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
          {pending && <RiLoaderLine className="animate-spin" data-icon="inline-start" />}
          Save and log in
        </Button>
      </form>
    </div>
  )
}
