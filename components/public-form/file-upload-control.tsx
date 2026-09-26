"use client"

import * as React from "react"
import { RiCloseLine, RiFileTextLine, RiLoaderLine, RiUploadCloud2Line } from "@remixicon/react"

import type { ControlProps } from "@/components/public-form/field-controls"
import { ACCEPT_LABEL, acceptAttr, FALLBACK_CONTENT_TYPE, formatBytes, isAllowedType } from "@/lib/fields/files"
import { LIMITS } from "@/lib/fields/registry"
import { cn } from "@/lib/utils"

type State =
  | { kind: "idle" }
  | { kind: "uploading"; name: string; progress: number }
  | { kind: "done"; name: string; size: number }

type SignResponse = {
  key: string
  token: string
  upload: { method: "POST"; url: string; fields: Record<string, string> } | { method: "PUT"; url: string; headers?: Record<string, string> }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? "Upload failed. Please try again.")
  return data as T
}

/** Direct-to-storage upload with progress (presigned POST enforces the size limit). */
function sendToStorage(upload: SignResponse["upload"], file: File, contentType: string, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(upload.method, upload.url)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed. Please try again.")))
    xhr.onerror = () => reject(new Error("Upload failed — check your connection and try again."))
    if (upload.method === "POST") {
      const body = new FormData()
      for (const [k, v] of Object.entries(upload.fields)) body.append(k, v)
      body.append("file", file)
      xhr.send(body)
    } else {
      for (const [k, v] of Object.entries(upload.headers ?? { "content-type": contentType })) xhr.setRequestHeader(k, v)
      xhr.send(file)
    }
  })
}

// §6 file_upload: dropzone / tap-to-upload. The answer is the Upload row id.
export function FileUploadControl({ field, id, value, onChange, onBlur, inputRef, describedBy, invalid, disabled, slug }: ControlProps<string>) {
  const accept = field.config?.accept ?? "any"
  const maxMB = Math.min(field.config?.maxSizeMB ?? LIMITS.fileDefaultMB, LIMITS.fileMaxMB)
  const [state, setState] = React.useState<State>({ kind: "idle" })
  const [error, setError] = React.useState<string | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const preview = !slug

  async function handle(file: File | undefined) {
    if (!file || disabled) return
    setError(null)
    const contentType = file.type || FALLBACK_CONTENT_TYPE
    if (!isAllowedType(accept, contentType)) return setError(`Please choose ${ACCEPT_LABEL[accept].toLowerCase()} only.`)
    if (file.size > maxMB * 1024 * 1024) return setError(`That file is ${formatBytes(file.size)}. The limit is ${maxMB} MB.`)
    if (file.size === 0) return setError("That file is empty.")
    if (preview) return setError("Uploads are disabled in preview.")

    setState({ kind: "uploading", name: file.name, progress: 0 })
    try {
      const signed = await postJson<SignResponse>("/api/upload/sign", {
        slug,
        fieldId: field.id,
        name: file.name,
        type: contentType,
        size: file.size,
      })
      await sendToStorage(signed.upload, file, contentType, (p) =>
        setState({ kind: "uploading", name: file.name, progress: p })
      )
      const done = await postJson<{ id: string; name: string; size: number }>("/api/upload/complete", {
        slug,
        fieldId: field.id,
        key: signed.key,
        token: signed.token,
        name: file.name,
      })
      setState({ kind: "done", name: done.name, size: done.size })
      onChange(done.id)
    } catch (err) {
      setState({ kind: "idle" })
      onChange("")
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
    } finally {
      onBlur()
      const input = document.getElementById(id) as HTMLInputElement | null
      if (input) input.value = ""
    }
  }

  function clear() {
    setState({ kind: "idle" })
    onChange("")
    setError(null)
    requestAnimationFrame(() => document.getElementById(id)?.focus())
  }

  const errorId = `${id}-upload-error`
  const describe = [describedBy, error ? errorId : null].filter(Boolean).join(" ") || undefined

  if (state.kind === "done" && value) {
    return (
      <div className="flex items-center gap-3 rounded-input border border-(--pf-accent-fg) bg-(--pf-accent-tint) px-4 py-3">
        <RiFileTextLine className="size-6 shrink-0 text-(--pf-accent-fg)" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-(--pf-text)!">{state.name}</p>
          <p className="text-[13px]">{formatBytes(state.size)} · uploaded</p>
        </div>
        <button
          type="button"
          onClick={clear}
          className="grid size-11 shrink-0 place-items-center rounded-full text-(--pf-muted) hover:bg-(--pf-surface)"
          aria-label={`Remove ${state.name}`}
        >
          <RiCloseLine className="size-5" />
        </button>
      </div>
    )
  }

  const uploading = state.kind === "uploading"

  return (
    <div>
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          void handle(e.dataTransfer.files?.[0])
        }}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-input border-2 border-dashed border-(--pf-border) px-4 py-6 text-center transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--pf-accent-fg)",
          (dragging || uploading) && "border-(--pf-accent-fg) bg-(--pf-accent-tint)",
          invalid && "border-(--pf-error)",
          (disabled || uploading) && "cursor-not-allowed"
        )}
      >
        <input
          ref={inputRef as React.Ref<HTMLInputElement>}
          id={id}
          name={field.id}
          type="file"
          accept={acceptAttr(accept)}
          disabled={disabled || uploading}
          aria-describedby={describe}
          aria-invalid={invalid || undefined}
          aria-required={field.required || undefined}
          className="sr-only"
          onChange={(e) => void handle(e.target.files?.[0])}
        />
        {uploading ? (
          <>
            <RiLoaderLine className="size-7 animate-spin text-(--pf-accent-fg)" aria-hidden />
            <span className="max-w-full truncate text-[15px] font-semibold">Uploading {state.name}…</span>
            <span className="h-1.5 w-40 overflow-hidden rounded-pill bg-(--pf-border)" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.progress * 100)} aria-label="Upload progress">
              <span className="block h-full bg-(--pf-accent) transition-[width]" style={{ width: `${Math.round(state.progress * 100)}%` }} />
            </span>
          </>
        ) : (
          <>
            <RiUploadCloud2Line className="size-7 text-(--pf-accent-fg)" aria-hidden />
            <span className="text-[15px] font-semibold">Tap to upload{preview ? "" : " or drop a file"}</span>
            <span className="text-[13px] text-(--pf-muted)">
              {ACCEPT_LABEL[accept]} · up to {maxMB} MB
            </span>
          </>
        )}
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-[14px] font-medium text-(--pf-error)!">
          {error}
        </p>
      )}
    </div>
  )
}
