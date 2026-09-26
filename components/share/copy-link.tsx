"use client"

import * as React from "react"
import { RiCheckLine, RiFileCopyLine } from "@remixicon/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

// §9.6 Copy button with Sonner toast.
export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = React.useState(false)
  const inputId = React.useId()

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copied")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked (http, permissions): select the text instead.
      const input = document.getElementById(inputId) as HTMLInputElement | null
      input?.select()
      toast.error("Couldn’t copy automatically — the link is selected, copy it manually.")
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor={inputId} className="sr-only">
        Public link
      </label>
      <input
        id={inputId}
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="h-12 min-w-0 flex-1 rounded-input border border-line bg-bg/60 px-4 font-mono text-[14px] text-ink outline-none focus:border-brand"
      />
      <Button size="lg" onClick={copy} className="shrink-0">
        {copied ? <RiCheckLine data-icon="inline-start" /> : <RiFileCopyLine data-icon="inline-start" />}
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  )
}
