import { ImageResponse } from "next/og"

import { loadPublicForm, metaDescription } from "@/app/(public)/f/[slug]/data"

// Link preview image for WhatsApp / social (§9.7, Phase 5). Design.md tokens inlined.
export const alt = "Form preview"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const form = await loadPublicForm(slug)
  const title = form?.title ?? "SimpleForms"
  const description = form ? metaDescription(form.description) : "Beautiful forms for Kenya."
  const accent = form?.settings.accentColor ?? "#067353"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 64,
          background: "linear-gradient(120deg, #E5F1D7 0%, #E8F1E3 50%, #DDECE4 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            background: "#FFFFFF",
            borderRadius: 40,
            padding: 64,
            boxShadow: "0 20px 50px rgba(18, 33, 25, 0.08)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "flex", width: 72, height: 8, borderRadius: 999, background: accent }} />
            <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: "#122119", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              {title.length > 80 ? `${title.slice(0, 77)}…` : title}
            </div>
            <div style={{ display: "flex", fontSize: 30, color: "#5C6B62", lineHeight: 1.4 }}>
              {description.length > 140 ? `${description.slice(0, 137)}…` : description}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                background: accent,
                color: "#FFFFFF",
                fontSize: 28,
                fontWeight: 700,
                padding: "16px 36px",
                borderRadius: 999,
              }}
            >
              Fill in the form →
            </div>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 800, color: "#122119" }}>SimpleForms</div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
