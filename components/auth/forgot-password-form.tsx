"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { RiLoaderLine, RiMailSendLine } from "@remixicon/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { requestPasswordResetAction } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth"

export function ForgotPasswordForm() {
  const [pending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string>()
  const [sentTo, setSentTo] = React.useState<string>()

  const form = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema), mode: "onBlur" })
  const error = form.formState.errors.email?.message

  const onSubmit = form.handleSubmit((values) => {
    setServerError(undefined)
    startTransition(async () => {
      const result = await requestPasswordResetAction(values)
      if (result?.error) {
        setServerError(result.error)
        toast.error(result.error)
      } else {
        setSentTo(values.email)
      }
    })
  })

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6" aria-live="polite">
        <div className="grid size-12 place-items-center rounded-[14px] bg-brand-tint">
          <RiMailSendLine className="size-[22px] text-brand" aria-hidden />
        </div>
        <div>
          <h1 className="h3">Check your email</h1>
          <p className="mt-2">
            If an account exists for <span className="font-semibold text-ink">{sentTo}</span>, we’ve sent a link to reset
            your password. It expires in an hour.
          </p>
        </div>
        <p className="text-[14px]">
          Nothing arrived? Check spam, or{" "}
          <button type="button" className="font-semibold text-brand hover:underline" onClick={() => setSentTo(undefined)}>
            try again
          </button>
          .
        </p>
        <Link href="/login" className="text-center text-[14px] font-semibold text-brand hover:underline">
          Back to log in
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="h3">Forgot your password?</h1>
        <p className="mt-2">Enter your email and we’ll send you a link to choose a new one.</p>
      </div>

      <form method="post" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-[14px] font-semibold text-ink">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="wanjiku@example.co.ke"
            className="h-12 bg-surface px-4 text-base"
            aria-invalid={!!error}
            aria-describedby={error ? "email-error" : undefined}
            {...form.register("email")}
          />
          {error && (
            <p id="email-error" className="text-[13px] text-destructive">
              {error}
            </p>
          )}
        </div>

        <p aria-live="polite" className="text-[14px] text-destructive empty:hidden">
          {serverError}
        </p>

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
          {pending && <RiLoaderLine className="animate-spin" data-icon="inline-start" />}
          Send reset link
        </Button>
      </form>

      <p className="text-center text-[14px]">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
