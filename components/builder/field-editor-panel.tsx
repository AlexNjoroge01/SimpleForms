"use client"

import * as React from "react"
import { RiDeleteBinLine, RiFileCopyLine, RiCursorLine } from "@remixicon/react"

import { OptionsEditor } from "@/components/builder/options-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { compatibleTypes, FIELD_REGISTRY, LIMITS, options as makeOptions } from "@/lib/fields/registry"
import type { Field, FieldConfig, FieldType } from "@/lib/fields/types"
import { useBuilderStore } from "@/stores/builder-store"

const labelClass = "text-[13px] font-semibold text-ink"
const inputClass = "h-11 bg-surface"

function Row({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor} className={labelClass}>
        {label}
      </Label>
      {children}
      {hint && <p className="footnote">{hint}</p>}
    </div>
  )
}

function SwitchRow({ id, label, checked, onChange, hint }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id} className={labelClass}>
          {label}
        </Label>
        {hint && <p className="footnote mt-1">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

/** Integer/number input where empty means "not set". */
function NumberInput({ id, value, onChange, min, max }: { id: string; value?: number; onChange: (v: number | undefined) => void; min?: number; max?: number }) {
  return (
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      className={inputClass}
      value={value ?? ""}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
    />
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-5">
      <h3 className="text-[12px] font-bold tracking-[0.14em] text-ink-muted uppercase">{title}</h3>
      {children}
    </section>
  )
}

export function FieldEditorPanel() {
  // Unique per instance: the desktop panel and mobile sheet can both be mounted.
  const uid = React.useId()
  const field = useBuilderStore((s) => s.fields.find((f) => f.id === s.selectedId))
  const update = useBuilderStore((s) => s.updateField)
  const changeType = useBuilderStore((s) => s.changeType)
  const duplicate = useBuilderStore((s) => s.duplicate)
  const remove = useBuilderStore((s) => s.remove)

  if (!field) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <div className="grid size-12 place-items-center rounded-[14px] bg-brand-tint">
          <RiCursorLine className="size-[22px] text-brand" aria-hidden />
        </div>
        <h2 className="h3">No question selected</h2>
        <p className="text-[14px]">Select a question on the canvas to edit it.</p>
      </div>
    )
  }

  const f = field
  const def = FIELD_REGISTRY[f.type]
  const types = compatibleTypes(f.type)
  const id = (k: string) => `${uid}-${f.id}-${k}`
  const set = (patch: Partial<Field>, key?: string) => update(f.id, patch, key)
  const setConfig = (patch: Partial<FieldConfig>, key?: string) => set({ config: { ...f.config, ...patch } }, key)
  const c = f.config ?? {}
  const isPreset = c.preset === "kenya_counties"

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="eyebrow">Question type</p>
        {types.length > 1 ? (
          <Select value={f.type} onValueChange={(t) => changeType(f.id, t as FieldType)}>
            <SelectTrigger className="h-11 w-full bg-surface" aria-label="Question type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {types.map((t) => {
                const Icon = FIELD_REGISTRY[t].icon
                return (
                  <SelectItem key={t} value={t}>
                    <Icon className="text-brand" /> {FIELD_REGISTRY[t].label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex h-11 items-center gap-2 rounded-input border border-line bg-surface px-3 text-[14px] font-semibold">
            <def.icon className="size-4 text-brand" aria-hidden /> {def.label}
          </div>
        )}
      </div>

      <Row label="Question" htmlFor={id("label")}>
        <Textarea
          id={id("label")}
          value={f.label}
          maxLength={LIMITS.labelMax}
          placeholder="Ask something…"
          className="min-h-11 bg-surface text-[15px] font-semibold"
          onChange={(e) => set({ label: e.target.value }, "label")}
          aria-invalid={!f.label.trim()}
        />
      </Row>

      <Row label="Help text (optional)" htmlFor={id("description")}>
        <Textarea
          id={id("description")}
          value={f.description ?? ""}
          maxLength={LIMITS.descriptionMax}
          placeholder="Add a short explanation"
          className="bg-surface"
          onChange={(e) => set({ description: e.target.value || undefined }, "description")}
        />
      </Row>

      {def.supportsPlaceholder && (
        <Row label="Placeholder" htmlFor={id("placeholder")}>
          <Input
            id={id("placeholder")}
            value={f.placeholder ?? ""}
            maxLength={LIMITS.placeholderMax}
            className={inputClass}
            onChange={(e) => set({ placeholder: e.target.value || undefined }, "placeholder")}
          />
        </Row>
      )}

      <SwitchRow id={id("required")} label="Required" checked={f.required} onChange={(required) => set({ required })} />

      {f.type === "dropdown" && (
        <SwitchRow
          id={id("preset")}
          label="Kenyan counties list"
          hint="Use all 47 counties as the options."
          checked={isPreset}
          onChange={(on) =>
            set({
              config: on ? { preset: "kenya_counties" } : {},
              options: on ? undefined : (f.options?.length ? f.options : makeOptions("Option 1", "Option 2")),
            })
          }
        />
      )}

      {def.supportsOptions && !isPreset && (
        <Section title="Options">
          <OptionsEditor options={f.options ?? []} onChange={(options, key) => set({ options }, key)} />
        </Section>
      )}

      <TypeSettings field={f} setConfig={setConfig} id={id} />

      <div className="flex gap-2 border-t border-line pt-5">
        <Button variant="outline" className="flex-1 bg-surface" onClick={() => duplicate(f.id)}>
          <RiFileCopyLine data-icon="inline-start" /> Duplicate
        </Button>
        <Button variant="destructive" className="flex-1" onClick={() => remove(f.id)}>
          <RiDeleteBinLine data-icon="inline-start" /> Delete
        </Button>
      </div>
    </div>
  )
}

function TypeSettings({
  field: f,
  setConfig,
  id,
}: {
  field: Field
  setConfig: (patch: Partial<FieldConfig>, key?: string) => void
  id: (k: string) => string
}) {
  const c = f.config ?? {}

  switch (f.type) {
    case "short_text":
    case "long_text": {
      const cap = f.type === "short_text" ? LIMITS.shortText : LIMITS.longText
      return (
        <Section title="Settings">
          <Row label="Maximum characters" htmlFor={id("maxLength")} hint={`Leave empty for the default (${cap.toLocaleString()}).`}>
            <NumberInput id={id("maxLength")} value={c.maxLength} min={1} max={cap} onChange={(maxLength) => setConfig({ maxLength: maxLength && Math.min(Math.max(1, Math.round(maxLength)), cap) }, "maxLength")} />
          </Row>
        </Section>
      )
    }
    case "number":
      return (
        <Section title="Settings">
          <SwitchRow id={id("currency")} label="Amount in KES" hint="Shows a KES prefix and thousands separators." checked={c.currency === "KES"} onChange={(on) => setConfig({ currency: on ? "KES" : undefined })} />
          <div className="grid grid-cols-2 gap-3">
            <Row label="Minimum" htmlFor={id("min")}>
              <NumberInput id={id("min")} value={c.min} onChange={(min) => setConfig({ min }, "min")} />
            </Row>
            <Row label="Maximum" htmlFor={id("max")}>
              <NumberInput id={id("max")} value={c.max} onChange={(max) => setConfig({ max }, "max")} />
            </Row>
          </div>
        </Section>
      )
    case "single_choice":
      return (
        <Section title="Settings">
          <SwitchRow id={id("other")} label="Allow “Other”" hint="Respondents can type their own answer." checked={!!c.allowOther} onChange={(allowOther) => setConfig({ allowOther: allowOther || undefined })} />
        </Section>
      )
    case "multiple_choice":
      return (
        <Section title="Settings">
          <SwitchRow id={id("other")} label="Allow “Other”" hint="Respondents can type their own answer." checked={!!c.allowOther} onChange={(allowOther) => setConfig({ allowOther: allowOther || undefined })} />
          <div className="grid grid-cols-2 gap-3">
            <Row label="Min choices" htmlFor={id("minSelect")}>
              <NumberInput id={id("minSelect")} value={c.minSelect} min={0} onChange={(v) => setConfig({ minSelect: v === undefined ? undefined : Math.max(0, Math.round(v)) }, "minSelect")} />
            </Row>
            <Row label="Max choices" htmlFor={id("maxSelect")}>
              <NumberInput id={id("maxSelect")} value={c.maxSelect} min={1} onChange={(v) => setConfig({ maxSelect: v === undefined ? undefined : Math.max(1, Math.round(v)) }, "maxSelect")} />
            </Row>
          </div>
        </Section>
      )
    case "date":
      return (
        <Section title="Settings">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Earliest date" htmlFor={id("minDate")}>
              <Input id={id("minDate")} type="date" className={inputClass} value={c.minDate ?? ""} onChange={(e) => setConfig({ minDate: e.target.value || undefined })} />
            </Row>
            <Row label="Latest date" htmlFor={id("maxDate")}>
              <Input id={id("maxDate")} type="date" className={inputClass} value={c.maxDate ?? ""} onChange={(e) => setConfig({ maxDate: e.target.value || undefined })} />
            </Row>
          </div>
        </Section>
      )
    case "file_upload":
      return (
        <Section title="Settings">
          <div className="grid grid-cols-2 gap-3">
            <Row label="File type" htmlFor={id("accept")}>
              <Select value={c.accept ?? "any"} onValueChange={(accept) => setConfig({ accept: accept as FieldConfig["accept"] })}>
                <SelectTrigger id={id("accept")} className="h-11 w-full bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any file</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </Row>
            <Row label="Max size" htmlFor={id("maxSize")}>
              <Select value={String(c.maxSizeMB ?? LIMITS.fileDefaultMB)} onValueChange={(v) => setConfig({ maxSizeMB: Number(v) })}>
                <SelectTrigger id={id("maxSize")} className="h-11 w-full bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 5, 10].map((mb) => (
                    <SelectItem key={mb} value={String(mb)}>
                      {mb} MB
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Row>
          </div>
        </Section>
      )
    default:
      return null
  }
}
