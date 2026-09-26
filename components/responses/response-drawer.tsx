"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { RiDeleteBinLine, RiDownload2Line, RiFileTextLine, RiLoaderLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { formatAnswer } from "@/lib/fields/display"
import { formatBytes, IMAGE_TYPES } from "@/lib/fields/files"
import type { Answers, Field } from "@/lib/fields/types"

type ResponseDetail = {
  id: string
  createdAt: string
  fields: Field[]
  answers: Answers
  files: { id: string; fieldId: string; name: string; bytes: number; contentType: string; url: string }[]
}

export const submittedAt = (iso: string) =>
  new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))

async function fetchResponse(formId: string, id: string): Promise<ResponseDetail> {
  const res = await fetch(`/api/forms/${formId}/responses/${id}`)
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn’t load this response.")
  return res.json()
}

// Full submission (§9.8): labels from the response's own fields snapshot,
// files as thumbnails/download links, phone formatted.
export function ResponseDrawer({
  formId,
  responseId,
  onClose,
  onDelete,
  deleting,
}: {
  formId: string
  responseId: string | null
  onClose: () => void
  onDelete: (id: string) => void
  deleting: boolean
}) {
  const { data, error, isPending } = useQuery({
    queryKey: ["response", formId, responseId],
    queryFn: () => fetchResponse(formId, responseId!),
    enabled: !!responseId,
  })

  return (
    <Sheet open={!!responseId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="gap-0 overflow-y-auto bg-surface p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <div className="sticky top-0 z-10 border-b border-line bg-surface px-6 pt-6 pb-4">
          <p className="eyebrow">Response</p>
          <SheetTitle className="mt-2 text-[20px] font-bold">{data ? submittedAt(data.createdAt) : "Loading…"}</SheetTitle>
          <SheetDescription className="sr-only">All answers in this submission</SheetDescription>
        </div>

        <div className="flex flex-col gap-1 px-6 py-4">
          {isPending && responseId && (
            <div className="flex flex-col gap-5 py-2" aria-label="Loading response">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-5 w-2/3" />
                </div>
              ))}
            </div>
          )}
          {error && <p className="py-6 text-destructive!">{error.message}</p>}
          {data && (
            <dl className="flex flex-col divide-y divide-line">
              {data.fields.map((f) => {
                const files = data.files.filter((x) => x.fieldId === f.id)
                return (
                  <div key={f.id} className="flex flex-col gap-1.5 py-4">
                    <dt className="text-[13px] font-semibold text-ink-muted">{f.label || "Untitled question"}</dt>
                    <dd className="text-[15px] font-medium wrap-break-word whitespace-pre-line text-ink">
                      {f.type === "file_upload" && files.length ? (
                        <ul className="flex flex-col gap-3">
                          {files.map((file) => (
                            <li key={file.id} className="flex items-center gap-3">
                              {IMAGE_TYPES.includes(file.contentType) ? (
                                // eslint-disable-next-line @next/next/no-img-element -- presigned redirect, not optimisable
                                <img src={`${file.url}?inline=1`} alt={file.name} className="size-16 shrink-0 rounded-input bg-bg object-cover" />
                              ) : (
                                <span className="grid size-16 shrink-0 place-items-center rounded-input bg-brand-tint">
                                  <RiFileTextLine className="size-6 text-brand" aria-hidden />
                                </span>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[14px] font-semibold text-ink!">{file.name}</p>
                                <p className="text-[13px]">{formatBytes(file.bytes)}</p>
                              </div>
                              <Button asChild variant="outline" size="icon" className="bg-surface" aria-label={`Download ${file.name}`}>
                                <a href={file.url}>
                                  <RiDownload2Line />
                                </a>
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        formatAnswer(f, data.answers[f.id])
                      )}
                    </dd>
                  </div>
                )
              })}
            </dl>
          )}
        </div>

        {data && (
          <div className="sticky bottom-0 mt-auto border-t border-line bg-surface px-6 py-4">
            <Button variant="destructive" onClick={() => onDelete(data.id)} disabled={deleting}>
              {deleting ? <RiLoaderLine className="animate-spin" data-icon="inline-start" /> : <RiDeleteBinLine data-icon="inline-start" />}
              Delete response
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
