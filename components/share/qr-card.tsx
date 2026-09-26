"use client"

import * as React from "react"
import QRCode from "qrcode"
import { RiDownload2Line, RiLoaderLine } from "@remixicon/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { QR_OPTIONS } from "@/lib/qr"

function download(href: string, filename: string) {
  const a = document.createElement("a")
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

// QR rendered client-side with PNG + SVG downloads (§9.6).
export function QRCard({ url, filename }: { url: string; filename: string }) {
  const [src, setSrc] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(url, { ...QR_OPTIONS, width: 480 })
      .then((d) => !cancelled && setSrc(d))
      .catch(() => toast.error("Couldn’t create the QR code"))
    return () => {
      cancelled = true
    }
  }, [url])

  async function downloadPng() {
    const data = await QRCode.toDataURL(url, { ...QR_OPTIONS, width: 1024 })
    download(data, `${filename}.png`)
  }

  async function downloadSvg() {
    const svg = await QRCode.toString(url, { ...QR_OPTIONS, type: "svg" })
    const href = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }))
    download(href, `${filename}.svg`)
    setTimeout(() => URL.revokeObjectURL(href), 1000)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="grid aspect-square w-full max-w-60 place-items-center rounded-card bg-white p-2 ring-1 ring-line">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL, nothing to optimise
          <img src={src} alt={`QR code linking to ${url}`} className="size-full" data-testid="qr-image" />
        ) : (
          <RiLoaderLine className="size-6 animate-spin text-ink-muted" aria-label="Generating QR code" />
        )}
      </div>
      <div className="flex w-full flex-wrap justify-center gap-2">
        <Button variant="outline" className="bg-surface" onClick={downloadPng} disabled={!src}>
          <RiDownload2Line data-icon="inline-start" /> PNG
        </Button>
        <Button variant="outline" className="bg-surface" onClick={downloadSvg} disabled={!src}>
          <RiDownload2Line data-icon="inline-start" /> SVG
        </Button>
      </div>
    </div>
  )
}
