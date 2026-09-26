"use client"

import * as React from "react"
import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react"

import { FileUploadControl } from "@/components/public-form/file-upload-control"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { choiceLabels, LIMITS } from "@/lib/fields/registry"
import type { Field } from "@/lib/fields/types"
import { formatAmountTyping } from "@/lib/kenya/currency"
import { formatPhoneTyping } from "@/lib/kenya/phone"
import { cn } from "@/lib/utils"

// Public renderers, one per field type (Blueprint §6 "Public input" column).
// All are controlled; the value shape matches what build-zod-schema expects.

export type ControlProps<V = unknown> = {
  field: Field
  id: string
  value: V
  onChange: (v: V) => void
  onBlur: () => void
  inputRef: React.Ref<HTMLElement>
  describedBy?: string
  invalid: boolean
  disabled?: boolean
  /** Public slug — needed by the file upload control. */
  slug?: string
}

export const inputClass =
  "h-12 w-full min-w-0 rounded-input border border-(--pf-border) bg-(--pf-input) px-4 text-base text-(--pf-text) outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-(--pf-subtle) focus:border-(--pf-accent-fg) focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--pf-accent)_22%,transparent)] focus-visible:outline-none disabled:opacity-60 aria-invalid:border-(--pf-error)"

const cardClass =
  "flex min-h-12 cursor-pointer items-center gap-3 rounded-input border border-(--pf-border) bg-(--pf-input) px-4 py-3 text-base text-(--pf-text) transition-colors duration-150 hover:border-(--pf-accent-fg) has-checked:border-(--pf-accent-fg) has-checked:bg-(--pf-accent-tint) has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--pf-accent-fg) has-disabled:cursor-not-allowed"

function Indicator({ multi }: { multi: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-5 shrink-0 place-items-center border-2 border-(--pf-border) text-white transition-colors peer-checked:border-(--pf-accent) peer-checked:bg-(--pf-accent) [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100",
        multi ? "rounded-[6px]" : "rounded-full"
      )}
    >
      <RiCheckLine className="size-3.5" />
    </span>
  )
}

// --- Text-like ------------------------------------------------------------------

function TextControl({ field, id, value, onChange, onBlur, inputRef, describedBy, invalid, disabled }: ControlProps<string>) {
  const max = field.config?.maxLength ?? (field.type === "long_text" ? LIMITS.longText : LIMITS.shortText)
  const common = {
    id,
    name: field.id,
    value: value ?? "",
    placeholder: field.placeholder,
    maxLength: max,
    disabled,
    "aria-describedby": describedBy,
    "aria-invalid": invalid || undefined,
    "aria-required": field.required || undefined,
    onBlur,
  }

  if (field.type === "long_text") {
    return (
      <textarea
        {...common}
        ref={inputRef as React.Ref<HTMLTextAreaElement>}
        rows={4}
        className={cn(inputClass, "field-sizing-content h-auto min-h-28 resize-none py-3 leading-relaxed")}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  return (
    <input
      {...common}
      ref={inputRef as React.Ref<HTMLInputElement>}
      type={field.type === "email" ? "email" : "text"}
      inputMode={field.type === "email" ? "email" : undefined}
      autoComplete={field.type === "email" ? "email" : undefined}
      autoCapitalize={field.type === "email" ? "none" : undefined}
      spellCheck={field.type === "email" ? false : undefined}
      className={inputClass}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function PhoneControl({ field, id, value, onChange, onBlur, inputRef, describedBy, invalid, disabled }: ControlProps<string>) {
  return (
    <div className="flex gap-2">
      <span className="flex h-12 shrink-0 items-center gap-1.5 rounded-input border border-(--pf-border) bg-(--pf-accent-tint) px-3 text-base font-semibold text-(--pf-text)" aria-hidden>
        <span>🇰🇪</span> +254
      </span>
      <input
        id={id}
        ref={inputRef as React.Ref<HTMLInputElement>}
        name={field.id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder={field.placeholder || "712 345 678"}
        value={value ?? ""}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        aria-required={field.required || undefined}
        className={inputClass}
        onChange={(e) => onChange(formatPhoneTyping(e.target.value))}
        onBlur={onBlur}
      />
    </div>
  )
}

function NumberControl({ field, id, value, onChange, onBlur, inputRef, describedBy, invalid, disabled }: ControlProps<string>) {
  const kes = field.config?.currency === "KES"
  const allowNegative = (field.config?.min ?? -1) < 0
  return (
    <div className="relative">
      {kes && (
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[15px] font-bold text-(--pf-muted)" aria-hidden>
          KES
        </span>
      )}
      <input
        id={id}
        ref={inputRef as React.Ref<HTMLInputElement>}
        name={field.id}
        type="text"
        inputMode="decimal"
        placeholder={field.placeholder}
        value={value ?? ""}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        aria-required={field.required || undefined}
        className={cn(inputClass, kes && "pl-14")}
        onChange={(e) => onChange(kes ? formatAmountTyping(e.target.value, { allowNegative }) : e.target.value)}
        onBlur={onBlur}
      />
      {kes && <span className="sr-only">Amount in Kenyan shillings</span>}
    </div>
  )
}

function DateControl({ field, id, value, onChange, onBlur, inputRef, describedBy, invalid, disabled }: ControlProps<string>) {
  return (
    <input
      id={id}
      ref={inputRef as React.Ref<HTMLInputElement>}
      name={field.id}
      type="date"
      min={field.config?.minDate}
      max={field.config?.maxDate}
      value={value ?? ""}
      disabled={disabled}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-required={field.required || undefined}
      className={cn(inputClass, "appearance-none scheme-light in-data-[theme=dark]:scheme-dark")}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    />
  )
}

// --- Choices --------------------------------------------------------------------

function OtherInput({ id, value, onChange, onBlur, disabled, active }: { id: string; value: string; onChange: (v: string) => void; onBlur: () => void; disabled?: boolean; active: boolean }) {
  const ref = React.useRef<HTMLInputElement>(null)
  const wasActive = React.useRef(active)
  React.useEffect(() => {
    if (active && !wasActive.current) ref.current?.focus()
    wasActive.current = active
  }, [active])
  if (!active) return null
  return (
    <input
      ref={ref}
      id={id}
      aria-label="Your answer for Other"
      placeholder="Type your answer"
      maxLength={LIMITS.optionMax}
      value={value}
      disabled={disabled}
      className={cn(inputClass, "mt-1")}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
    />
  )
}

function SingleChoiceControl({ field, id, value, onChange, onBlur, inputRef, describedBy, invalid, disabled }: ControlProps<string>) {
  const labels = choiceLabels(field)
  const allowOther = !!field.config?.allowOther
  const initialOther = !!value && !labels.includes(value)
  const [otherActive, setOtherActive] = React.useState(initialOther)
  const [otherText, setOtherText] = React.useState(initialOther ? value : "")

  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={describedBy} aria-invalid={invalid || undefined} aria-required={field.required || undefined} className="grid gap-2">
      {labels.map((label, i) => (
        <label key={`${i}-${label}`} className={cardClass}>
          <input
            ref={i === 0 ? (inputRef as React.Ref<HTMLInputElement>) : undefined}
            type="radio"
            name={field.id}
            value={label}
            checked={!otherActive && value === label}
            disabled={disabled}
            className="peer sr-only"
            onChange={() => {
              setOtherActive(false)
              onChange(label)
            }}
            onBlur={onBlur}
          />
          <Indicator multi={false} />
          <span className="min-w-0 wrap-break-word">{label}</span>
        </label>
      ))}
      {allowOther && (
        <>
          <label className={cardClass}>
            <input
              type="radio"
              name={field.id}
              value="__other__"
              checked={otherActive}
              disabled={disabled}
              className="peer sr-only"
              onChange={() => {
                setOtherActive(true)
                onChange(otherText)
              }}
              onBlur={onBlur}
            />
            <Indicator multi={false} />
            <span>Other</span>
          </label>
          <OtherInput
            id={`${id}-other`}
            active={otherActive}
            value={otherText}
            disabled={disabled}
            onBlur={onBlur}
            onChange={(t) => {
              setOtherText(t)
              onChange(t)
            }}
          />
        </>
      )}
    </div>
  )
}

function MultipleChoiceControl({ field, id, value, onChange, onBlur, inputRef, describedBy, disabled }: ControlProps<string[]>) {
  const labels = choiceLabels(field)
  const allowOther = !!field.config?.allowOther
  const current = Array.isArray(value) ? value : []
  const initialOther = current.find((v) => !labels.includes(v))
  const [otherActive, setOtherActive] = React.useState(initialOther !== undefined)
  const [otherText, setOtherText] = React.useState(initialOther ?? "")
  const selected = current.filter((v) => labels.includes(v))

  const emit = (sel: string[], active: boolean, text: string) =>
    onChange([...labels.filter((l) => sel.includes(l)), ...(active && text.trim() ? [text] : [])])

  const { minSelect, maxSelect } = field.config ?? {}
  const hint =
    minSelect && maxSelect
      ? `Choose ${minSelect}–${maxSelect}`
      : minSelect
        ? `Choose at least ${minSelect}`
        : maxSelect
          ? `Choose up to ${maxSelect}`
          : null

  return (
    <div role="group" aria-labelledby={`${id}-label`} aria-describedby={describedBy} className="grid gap-2">
      {hint && <p className="text-[14px]">{hint}</p>}
      {labels.map((label, i) => (
        <label key={`${i}-${label}`} className={cardClass}>
          <input
            ref={i === 0 ? (inputRef as React.Ref<HTMLInputElement>) : undefined}
            type="checkbox"
            name={field.id}
            value={label}
            checked={selected.includes(label)}
            disabled={disabled}
            className="peer sr-only"
            onChange={(e) =>
              emit(e.target.checked ? [...selected, label] : selected.filter((s) => s !== label), otherActive, otherText)
            }
            onBlur={onBlur}
          />
          <Indicator multi />
          <span className="min-w-0 wrap-break-word">{label}</span>
        </label>
      ))}
      {allowOther && (
        <>
          <label className={cardClass}>
            <input
              type="checkbox"
              name={field.id}
              value="__other__"
              checked={otherActive}
              disabled={disabled}
              className="peer sr-only"
              onChange={(e) => {
                setOtherActive(e.target.checked)
                emit(selected, e.target.checked, otherText)
              }}
              onBlur={onBlur}
            />
            <Indicator multi />
            <span>Other</span>
          </label>
          <OtherInput
            id={`${id}-other`}
            active={otherActive}
            value={otherText}
            disabled={disabled}
            onBlur={onBlur}
            onChange={(t) => {
              setOtherText(t)
              emit(selected, true, t)
            }}
          />
        </>
      )}
    </div>
  )
}

const SEARCHABLE_OVER = 10

function DropdownControl({ field, id, value, onChange, onBlur, inputRef, describedBy, invalid, disabled }: ControlProps<string>) {
  const labels = choiceLabels(field)
  const [open, setOpen] = React.useState(false)
  const placeholder = field.placeholder || "Select…"

  // Short lists: native select (best on phones). Long lists: searchable (§6).
  if (labels.length <= SEARCHABLE_OVER) {
    return (
      <div className="relative">
        <select
          id={id}
          ref={inputRef as React.Ref<HTMLSelectElement>}
          name={field.id}
          value={value ?? ""}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          aria-required={field.required || undefined}
          className={cn(inputClass, "appearance-none pr-11", !value && "text-(--pf-subtle)")}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        >
          <option value="">{placeholder}</option>
          {labels.map((l, i) => (
            <option key={`${i}-${l}`} value={l} className="text-ink">
              {l}
            </option>
          ))}
        </select>
        <RiArrowDownSLine className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-(--pf-muted)" aria-hidden />
      </div>
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) onBlur()
      }}
    >
      <PopoverTrigger asChild>
        <button
          id={id}
          ref={inputRef as React.Ref<HTMLButtonElement>}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
          aria-haspopup="listbox"
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          aria-required={field.required || undefined}
          disabled={disabled}
          className={cn(inputClass, "flex items-center justify-between gap-2 text-left", !value && "text-(--pf-subtle)")}
        >
          <span className="truncate">{value || placeholder}</span>
          <RiArrowDownSLine className="size-5 shrink-0 text-(--pf-muted)" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent id={`${id}-listbox`} align="start" className="w-(--radix-popover-trigger-width) min-w-64 p-0">
        <Command>
          <CommandInput placeholder="Search…" className="text-base" />
          <CommandList className="max-h-72">
            <CommandEmpty>No match.</CommandEmpty>
            {labels.map((l, i) => (
              <CommandItem
                key={`${i}-${l}`}
                value={l}
                onSelect={() => {
                  onChange(l)
                  setOpen(false)
                }}
                className="min-h-11 text-base"
              >
                {l}
                {value === l && <RiCheckLine className="ml-auto size-4" aria-hidden />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function YesNoControl({ field, id, value, onChange, onBlur, inputRef, describedBy, invalid, disabled }: ControlProps<string>) {
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={describedBy} aria-invalid={invalid || undefined} aria-required={field.required || undefined} className="grid grid-cols-2 gap-3">
      {(["yes", "no"] as const).map((v, i) => (
        <label
          key={v}
          className={cn(cardClass, "h-14 justify-center text-[17px] font-bold has-checked:bg-(--pf-accent) has-checked:text-white has-checked:border-(--pf-accent)")}
        >
          <input
            ref={i === 0 ? (inputRef as React.Ref<HTMLInputElement>) : undefined}
            type="radio"
            name={field.id}
            value={v}
            checked={value === v}
            disabled={disabled}
            className="sr-only"
            onChange={() => onChange(v)}
            onBlur={onBlur}
          />
          {v === "yes" ? "Yes" : "No"}
        </label>
      ))}
    </div>
  )
}

/** Controls that render a group (fieldset-like) rather than a single labelled input. */
export function isGroupControl(field: Field) {
  return field.type === "single_choice" || field.type === "multiple_choice" || field.type === "yes_no"
}

export function FieldControl(props: ControlProps) {
  switch (props.field.type) {
    case "short_text":
    case "long_text":
    case "email":
      return <TextControl {...(props as ControlProps<string>)} />
    case "phone":
      return <PhoneControl {...(props as ControlProps<string>)} />
    case "number":
      return <NumberControl {...(props as ControlProps<string>)} />
    case "date":
      return <DateControl {...(props as ControlProps<string>)} />
    case "single_choice":
      return <SingleChoiceControl {...(props as ControlProps<string>)} />
    case "multiple_choice":
      return <MultipleChoiceControl {...(props as ControlProps<string[]>)} />
    case "dropdown":
      return <DropdownControl {...(props as ControlProps<string>)} />
    case "yes_no":
      return <YesNoControl {...(props as ControlProps<string>)} />
    case "file_upload":
      return <FileUploadControl {...(props as ControlProps<string>)} />
  }
}
