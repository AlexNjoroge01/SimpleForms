"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { RiGoogleFill, RiLoaderLine } from "@remixicon/react"
import { useForm, type FieldValues, type Path, type Resolver } from "react-hook-form"
import { toast } from "sonner"

import { googleSignInAction, loginAction, signupAction } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginSchema, signupSchema } from "@/lib/validation/auth"

type Mode = "login" | "signup"

const copy = {
  login: {
    title: "Welcome back",
    intro: "Log in to manage your forms and responses.",
    submit: "Log in",
    switchText: "New to SimpleForms?",
    switchLink: { href: "/signup", label: "Create an account" },
  },
  signup: {
    title: "Create your account",
    intro: "Free while in beta. No card needed.",
    submit: "Create account",
    switchText: "Already have an account?",
    switchLink: { href: "/login", label: "Log in" },
  },
}

const fields: Record<Mode, { name: string; label: string; type: string; autoComplete: string; placeholder: string }[]> = {
  login: [
    { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "wanjiku@example.co.ke" },
    { name: "password", label: "Password", type: "password", autoComplete: "current-password", placeholder: "••••••••" },
  ],
  signup: [
    { name: "name", label: "Full name", type: "text", autoComplete: "name", placeholder: "John Kamau" },
    { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "john@example.co.ke" },
    { name: "password", label: "Password", type: "password", autoComplete: "new-password", placeholder: "At least 8 characters" },
  ],
}

export function AuthForm({ mode, googleEnabled }: { mode: Mode; googleEnabled: boolean }) {
  const t = copy[mode]
  const callbackUrl = useSearchParams().get("callbackUrl") ?? undefined
  const [pending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string>()

  const form = useForm<FieldValues>({
    resolver: zodResolver(mode === "login" ? loginSchema : signupSchema) as unknown as Resolver<FieldValues>, // one form, two schemas
    mode: "onBlur",
  })

  const onSubmit = form.handleSubmit((values) => {
    setServerError(undefined)
    startTransition(async () => {
      const action = mode === "login" ? loginAction : signupAction
      const result = await action(values, callbackUrl)
      if (result?.error) {
        setServerError(result.error)
        toast.error(result.error)
      }
    })
  })

  const switchHref = callbackUrl
    ? `${t.switchLink.href}?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : t.switchLink.href

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="h3">{t.title}</h1>
        <p className="mt-2">{t.intro}</p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full bg-surface"
        disabled={!googleEnabled || pending}
        title={googleEnabled ? undefined : "Google sign-in isn’t configured yet"}
        onClick={() => startTransition(() => googleSignInAction(callbackUrl))}
      >
        <RiGoogleFill data-icon="inline-start" /> Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-[13px] text-ink-muted" aria-hidden>
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <form method="post" onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {fields[mode].map((f) => {
          const error = form.formState.errors[f.name]?.message as string | undefined
          const errorId = `${f.name}-error`
          return (
            <div key={f.name} className="flex flex-col gap-2">
              <Label htmlFor={f.name} className="text-[14px] font-semibold text-ink">
                {f.label}
              </Label>
              <Input
                id={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                placeholder={f.placeholder}
                className="h-12 bg-surface px-4 text-base"
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                {...form.register(f.name as Path<FieldValues>)}
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
        </p>

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
          {pending && <RiLoaderLine className="animate-spin" data-icon="inline-start" />}
          {t.submit}
        </Button>
      </form>

      <p className="text-center text-[14px]">
        {t.switchText}{" "}
        <Link href={switchHref} className="font-semibold text-brand hover:underline">
          {t.switchLink.label}
        </Link>
      </p>
    </div>
  )
}
