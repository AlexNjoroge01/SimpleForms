import type { Metadata } from "next"
import Link from "next/link"
import { RiExternalLinkLine, RiLockLine, RiRocketLine, RiWhatsappLine } from "@remixicon/react"

import { FormNav } from "@/components/app/form-nav"
import { CopyLink } from "@/components/share/copy-link"
import { QRCard } from "@/components/share/qr-card"
import { Button } from "@/components/ui/button"
import { appUrl } from "@/lib/env"
import { getMyFormOr404 } from "@/lib/forms"

export const metadata: Metadata = { title: "Share" }

const fileSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50) || "form"

// Share (§9.6): public URL, copy, QR (PNG/SVG), WhatsApp, open.
export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const form = await getMyFormOr404(id)
  const title = form.publishedTitle ?? form.title

  if (!form.slug || form.status === "DRAFT") {
    return (
      <>
        <FormNav form={form} active="share" />
        <div className="container-site py-12">
          <div className="flex flex-col items-center gap-4 rounded-card bg-surface p-12 text-center shadow-card">
            <div className="grid size-12 place-items-center rounded-[14px] bg-brand-tint">
              <RiRocketLine className="size-[22px] text-brand" aria-hidden />
            </div>
            <h2 className="h3">Publish your form to share it</h2>
            <p className="max-w-sm">Once it’s published you’ll get a short link, a QR code and a WhatsApp share button.</p>
            <Button asChild size="lg">
              <Link href={`/forms/${form.id}/edit`}>Open the editor</Link>
            </Button>
          </div>
        </div>
      </>
    )
  }

  const url = `${appUrl}/f/${form.slug}`
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`

  return (
    <>
      <FormNav form={form} active="share" />
      <div className="container-site grid gap-6 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex flex-col gap-6 rounded-card bg-surface p-6 shadow-card sm:p-8" aria-labelledby="share-link">
          <div>
            <p className="eyebrow">Share</p>
            <h2 id="share-link" className="h3 mt-3">
              Your form’s link
            </h2>
            <p className="mt-2 text-[15px]">Anyone with this link can fill in the form — no account needed.</p>
          </div>

          {form.status === "CLOSED" && (
            <p className="flex items-start gap-2 rounded-input bg-gold/15 px-4 py-3 text-[14px] font-medium text-[#8A5A12]">
              <RiLockLine className="mt-0.5 size-4 shrink-0" aria-hidden />
              This form is closed. People who open the link will see that it’s no longer accepting responses. Reopen it
              from the dashboard.
            </p>
          )}

          <CopyLink url={url} />

          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg">
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                <RiWhatsappLine data-icon="inline-start" /> Share on WhatsApp
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-surface">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <RiExternalLinkLine data-icon="inline-start" /> Open form
              </a>
            </Button>
          </div>
        </section>

        <section className="rounded-card bg-surface p-6 shadow-card sm:p-8" aria-labelledby="share-qr">
          <p className="eyebrow">QR code</p>
          <h2 id="share-qr" className="h3 mt-3">
            Print it or put it on a slide
          </h2>
          <p className="mt-2 mb-6 text-[15px]">Scanning it with a phone camera opens the form.</p>
          <QRCard url={url} filename={`${fileSlug(title)}-qr`} />
        </section>
      </div>
    </>
  )
}
