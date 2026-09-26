"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm, type FieldErrors, type Resolver } from "react-hook-form"
import { RiErrorWarningLine, RiLoaderLine } from "@remixicon/react"
import { toast } from "sonner"

import { FieldControl, isGroupControl } from "@/components/public-form/field-controls"
import { buildZodSchema } from "@/lib/fields/build-zod-schema"
import type { Field, FormSettings } from "@/lib/fields/types"
import { cn } from "@/lib/utils"

export type PublicFormData = {
  title: string
  description: string | null
  fields: Field[]
  settings: FormSettings
}

type Values = Record<string, unknown>

const emptyValue = (f: Field) => (f.type === "multiple_choice" ? [] : "")

/** Page shell for every public form state: themed background + card (§9.7). */
export function PublicFormShell({
  settings,
  children,
  className,
}: {
  settings: Pick<FormSettings, "theme" | "accentColor" | "showBranding">
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn("pf @container min-h-svh px-4 py-8", className)}
      data-theme={settings.theme}
      style={{ "--accent-color": settings.accentColor } as React.CSSProperties}
    >
      <div className="mx-auto w-full max-w-160 @lg:py-8">
        <div className="rounded-card border border-transparent bg-(--pf-surface) p-6 shadow-card in-data-[theme=dark]:border-(--pf-border) @lg:p-10">
          {children}
        </div>
        {settings.showBranding && (
          <p className="mt-6 text-center text-[13px]">
            Made with{" "}
            <Link href="/" className="font-bold text-(--pf-text) underline-offset-4 hover:underline">
              SimpleForms
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

function Question({
  field,
  id,
  error,
  children,
}: {
  field: Field
  id: string
  error?: string
  children: (describedBy: string | undefined) => React.ReactNode
}) {
  const descId = field.description ? `${id}-desc` : undefined
  const errId = `${id}-error`
  const describedBy = [descId, error ? errId : null].filter(Boolean).join(" ") || undefined
  const group = isGroupControl(field)
  const Label = group ? "p" : "label"

  return (
    <div id={`q-${field.id}`} className="flex scroll-mt-6 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <Label id={`${id}-label`} {...(group ? {} : { htmlFor: id })} className="text-[17px] leading-snug font-bold text-(--pf-text)">
          {field.label}
          {field.required && (
            <>
              <span className="ml-1 text-(--pf-error)" aria-hidden>
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          )}
        </Label>
        {field.description && (
          <p id={descId} className="text-[15px] leading-normal whitespace-pre-line">
            {field.description}
          </p>
        )}
      </div>
      {children(describedBy)}
      <p id={errId} aria-live="polite" className="empty:hidden flex items-center gap-1.5 text-[14px] font-medium text-(--pf-error)!">
        {error && (
          <>
            <RiErrorWarningLine className="size-4 shrink-0" aria-hidden />
            {error}
          </>
        )}
      </p>
    </div>
  )
}

/**
 * The public form (§9.7). Validates with the same Zod schema as the server
 * (on blur, then on change), focuses the first error, and posts to
 * /api/submit/[slug]. In preview mode, validation runs but nothing is sent.
 */
export function PublicForm({ form, slug, mode = "live" }: { form: PublicFormData; slug?: string; mode?: "live" | "preview" }) {
  const router = useRouter()
  const uid = React.useId()
  const schema = React.useMemo(() => buildZodSchema(form.fields), [form.fields])
  const defaultValues = React.useMemo(() => Object.fromEntries(form.fields.map((f) => [f.id, emptyValue(f)])), [form.fields])
  const honeypot = React.useRef<HTMLInputElement>(null)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [sending, setSending] = React.useState(false)
  const [done, setDone] = React.useState(false)

  const resolver: Resolver<Values> = React.useCallback(
    async (values) => {
      const result = schema.safeParse(values)
      if (result.success) return { values: result.data as Values, errors: {} }
      const errors: FieldErrors<Values> = {}
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "")
        if (key && !errors[key]) errors[key] = { type: "validate", message: issue.message }
      }
      return { values: {}, errors }
    },
    [schema]
  )

  const {
    control,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ mode: "onTouched", defaultValues, resolver, shouldFocusError: false })

  /** Scroll to + focus the first invalid question in form order. */
  function focusFirstError(ids: string[]) {
    const first = form.fields.find((f) => ids.includes(f.id))
    if (!first) return
    // Next frame: inputs may still be disabled from the in-flight request.
    requestAnimationFrame(() => {
      const el = document.getElementById(`q-${first.id}`)
      el?.scrollIntoView({ behavior: "smooth", block: "center" })
      el?.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select, button")?.focus({ preventScroll: true })
    })
  }

  async function onValid() {
    setFormError(null)
    if (mode === "preview") {
      toast.success("Everything checks out", { description: "Submissions are disabled in preview." })
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/submit/${slug}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers: getValues(), _hp: honeypot.current?.value ?? "" }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setDone(true)
        router.push(`/f/${slug}/thanks`)
        return
      }
      if (res.status === 422 && data.fieldErrors) {
        const ids = Object.keys(data.fieldErrors)
        for (const id of ids) setError(id, { type: "server", message: data.fieldErrors[id] })
        focusFirstError(ids)
        return
      }
      if (res.status === 403 && data.state) {
        router.refresh() // re-render as closed / limit reached
        return
      }
      setFormError(data.error ?? "Something went wrong. Please try again.")
    } catch {
      setFormError("You appear to be offline. Check your connection and try again.")
    } finally {
      setSending(false)
    }
  }

  const busy = isSubmitting || sending || done

  return (
    <form method="post" noValidate onSubmit={(e) => handleSubmit(onValid, (errs) => focusFirstError(Object.keys(errs)))(e)} className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-[28px] leading-[1.1] font-extrabold tracking-[-0.03em] text-(--pf-text) @lg:text-[34px]">{form.title}</h1>
        {form.description && <p className="text-[16px] whitespace-pre-line">{form.description}</p>}
        {form.fields.some((f) => f.required) && (
          <p className="text-[13px]">
            <span className="text-(--pf-error)" aria-hidden>
              *
            </span>{" "}
            Required
          </p>
        )}
      </header>

      {form.fields.map((field) => {
        const id = `${uid}-${field.id}`
        const error = errors[field.id]?.message as string | undefined
        return (
          <Question key={field.id} field={field} id={id} error={error}>
            {(describedBy) => (
              <Controller
                name={field.id}
                control={control}
                render={({ field: rhf }) => (
                  <FieldControl
                    field={field}
                    id={id}
                    value={rhf.value}
                    onChange={rhf.onChange}
                    onBlur={rhf.onBlur}
                    inputRef={rhf.ref}
                    describedBy={describedBy}
                    invalid={!!error}
                    disabled={sending || done}
                    slug={mode === "live" ? slug : undefined}
                  />
                )}
              />
            )}
          </Question>
        )
      })}

      {/* Honeypot (§9.7): invisible to people, tempting to bots. */}
      <div aria-hidden className="sr-only">
        <label>
          Leave this empty
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {formError && (
          <p role="alert" className="flex items-start gap-2 rounded-input bg-(--pf-accent-tint) px-4 py-3 text-[15px] font-medium text-(--pf-error)!">
            <RiErrorWarningLine className="mt-0.5 size-5 shrink-0" aria-hidden />
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-pill bg-(--pf-accent) px-7 text-[16px] font-bold text-white transition-[transform,filter] duration-150 hover:-translate-y-px hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-70 @lg:w-auto @lg:self-start"
        >
          {busy && <RiLoaderLine className="size-5 animate-spin" aria-hidden />}
          {busy ? "Submitting…" : form.settings.submitButtonText}
        </button>
      </div>
    </form>
  )
}
