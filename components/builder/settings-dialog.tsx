"use client"

import * as React from "react"
import { RiCheckLine, RiLoaderLine } from "@remixicon/react"
import { format } from "date-fns"
import { toast } from "sonner"

import { saveSettings } from "@/app/(app)/forms/[id]/edit/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ACCENT_PRESETS } from "@/lib/fields/settings"
import type { FormSettings } from "@/lib/fields/types"
import { cn } from "@/lib/utils"

const labelClass = "text-[13px] font-semibold text-ink"

/** ISO → value for <input type="datetime-local"> in the browser's timezone. */
const toLocalInput = (iso?: string | null) => (iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : "")

// Remount (via `key`) on each open so it starts from the saved values.
// Toolbar → Settings (§9.4): theme, accent, submit text, success message, close date, limit, branding.
export function SettingsDialog({
  formId,
  open,
  onOpenChange,
  settings,
  onSaved,
}: {
  formId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: FormSettings
  onSaved: (s: FormSettings) => void
}) {
  const uid = React.useId()
  const [draft, setDraft] = React.useState(settings)
  const [closeAt, setCloseAt] = React.useState(toLocalInput(settings.closeAt))
  const [limit, setLimit] = React.useState(settings.responseLimit ? String(settings.responseLimit) : "")
  const [pending, startTransition] = React.useTransition()

  const set = <K extends keyof FormSettings>(k: K, v: FormSettings[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const id = (k: string) => `${uid}-${k}`

  function save(e: React.FormEvent) {
    e.preventDefault()
    const next: FormSettings = {
      ...draft,
      closeAt: closeAt ? new Date(closeAt).toISOString() : null,
      responseLimit: limit ? Number(limit) : null,
    }
    startTransition(async () => {
      const res = await saveSettings(formId, next)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      onSaved(res.settings)
      onOpenChange(false)
      toast.success("Settings saved")
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Form settings</DialogTitle>
          <DialogDescription>These apply to the live form as soon as you save.</DialogDescription>
        </DialogHeader>

        <form id={id("form")} onSubmit={save} className="flex flex-col gap-6">
          <fieldset className="flex flex-col gap-3">
            <legend className={labelClass}>Theme</legend>
            <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Theme">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={draft.theme === t}
                  onClick={() => set("theme", t)}
                  className={cn(
                    "flex h-12 items-center justify-center gap-2 rounded-input border text-[14px] font-semibold capitalize transition-colors",
                    draft.theme === t ? "border-brand bg-brand-tint text-brand" : "border-line bg-surface text-ink-muted hover:border-brand"
                  )}
                >
                  <span className={cn("size-4 rounded-full border border-line", t === "dark" ? "bg-dark" : "bg-surface")} aria-hidden />
                  {t}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={labelClass}>Accent colour</legend>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Accent colour">
              {ACCENT_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={draft.accentColor === p.value}
                  aria-label={p.name}
                  title={p.name}
                  onClick={() => set("accentColor", p.value)}
                  className="grid size-10 place-items-center rounded-full text-white ring-offset-2 transition-transform hover:-translate-y-px aria-checked:ring-2 aria-checked:ring-ink"
                  style={{ backgroundColor: p.value }}
                >
                  {draft.accentColor === p.value && <RiCheckLine className="size-5" aria-hidden />}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <Label htmlFor={id("submit")} className={labelClass}>
              Submit button text
            </Label>
            <Input id={id("submit")} className="h-11 bg-surface" maxLength={40} value={draft.submitButtonText} onChange={(e) => set("submitButtonText", e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={id("success")} className={labelClass}>
              Message after submitting
            </Label>
            <Textarea id={id("success")} className="bg-surface" maxLength={500} value={draft.successMessage} onChange={(e) => set("successMessage", e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={id("closeAt")} className={labelClass}>
                Close on (optional)
              </Label>
              <Input id={id("closeAt")} type="datetime-local" className="h-11 bg-surface" value={closeAt} onChange={(e) => setCloseAt(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={id("limit")} className={labelClass}>
                Response limit (optional)
              </Label>
              <Input
                id={id("limit")}
                type="number"
                inputMode="numeric"
                min={1}
                className="h-11 bg-surface"
                placeholder="No limit"
                value={limit}
                onChange={(e) => setLimit(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <Label htmlFor={id("branding")} className={labelClass}>
                Show “Made with SimpleForms”
              </Label>
              <p className="footnote mt-1">A small footer under your form.</p>
            </div>
            <Switch id={id("branding")} checked={draft.showBranding} onCheckedChange={(v) => set("showBranding", v)} />
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={id("form")} disabled={pending}>
            {pending && <RiLoaderLine className="animate-spin" data-icon="inline-start" />}
            Save settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
