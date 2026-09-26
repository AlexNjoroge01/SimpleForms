import "server-only"

import { Files } from "files-sdk"
import { neon } from "files-sdk/neon"
import { nanoid } from "nanoid"

import { env } from "@/lib/env"
import { STORAGE_BUCKET } from "@/lib/storage-bucket"

// Neon Object Storage (S3-compatible). Credentials never leave the server;
// browsers upload/download directly via short-lived presigned URLs.
export const files = new Files({
  adapter: neon({
    bucket: STORAGE_BUCKET,
    endpoint: env.AWS_ENDPOINT_URL_S3,
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  }),
})

/** Object key for a submission upload: `forms/{formId}/{random}/{safe-name}`. */
export function uploadKey(formId: string, originalName: string) {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-80) || "file"
  return `forms/${formId}/${nanoid(16)}/${safe}`
}

/** Presigned POST that enforces size server-side (content-length-range). */
export function signUpload(key: string, opts: { maxBytes: number; contentType: string }) {
  return files.signedUploadUrl(key, {
    expiresIn: 60 * 10,
    maxSize: opts.maxBytes,
    contentType: opts.contentType,
  })
}

/**
 * Short-lived download URL. Forced to attachment so uploads never render
 * inline — except raster images the owner previews (`inline: true`).
 */
export function downloadUrl(key: string, originalName?: string | null, { expiresIn = 60 * 60, inline = false } = {}) {
  const filename = (originalName ?? "file").replace(/[^\x20-\x7e]|["\\]/g, "_")
  return files.url(key, {
    expiresIn,
    responseContentDisposition: `${inline ? "inline" : "attachment"}; filename="${filename}"`,
  })
}

export function deleteObjects(keys: string[]) {
  return keys.length ? files.delete(keys) : Promise.resolve()
}
