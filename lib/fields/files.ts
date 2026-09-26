import type { FieldConfig } from "@/lib/fields/types"

// File upload rules shared by the public dropzone and the upload routes (§10).
// Files are always downloaded as attachments, never rendered inline, so "any"
// is safe; SVG is excluded from "image" because it can carry script.

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"]
export const PDF_TYPES = ["application/pdf"]

type Accept = NonNullable<FieldConfig["accept"]>

export const ACCEPT_LABEL: Record<Accept, string> = { image: "Images", pdf: "PDF", any: "Any file" }

/** Value for the `<input type="file" accept>` attribute. */
export function acceptAttr(accept: Accept = "any"): string | undefined {
  if (accept === "image") return IMAGE_TYPES.join(",")
  if (accept === "pdf") return PDF_TYPES.join(",")
  return undefined
}

export function isAllowedType(accept: Accept = "any", contentType: string): boolean {
  if (accept === "image") return IMAGE_TYPES.includes(contentType)
  if (accept === "pdf") return PDF_TYPES.includes(contentType)
  return contentType.length > 0 && contentType.length <= 127
}

export const FALLBACK_CONTENT_TYPE = "application/octet-stream"

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
