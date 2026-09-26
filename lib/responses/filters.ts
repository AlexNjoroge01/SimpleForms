import { z } from "zod"

// Response search/filters (§9.8), shared by the table API, the page's URL
// state and the CSV export (§11 "respect current search/filters").

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const responseFiltersSchema = z.object({
  q: z.string().trim().max(200).optional().catch(undefined),
  from: day.optional().catch(undefined),
  to: day.optional().catch(undefined),
  field: z.string().regex(/^[a-z0-9]{1,32}$/i).optional().catch(undefined),
  value: z.string().max(200).optional().catch(undefined),
})

export type ResponseFilters = z.infer<typeof responseFiltersSchema>

const KEYS = ["q", "from", "to", "field", "value"] as const

export function parseFilters(sp: URLSearchParams): ResponseFilters {
  const raw = Object.fromEntries(KEYS.map((k) => [k, sp.get(k) || undefined]))
  const f = responseFiltersSchema.parse(raw)
  // A field filter needs both halves.
  if (!f.field || !f.value) return { ...f, field: undefined, value: undefined }
  return f
}

export function filtersToParams(f: ResponseFilters): URLSearchParams {
  const sp = new URLSearchParams()
  for (const k of KEYS) if (f[k]) sp.set(k, f[k]!)
  return sp
}

export function hasFilters(f: ResponseFilters) {
  return KEYS.some((k) => !!f[k])
}
