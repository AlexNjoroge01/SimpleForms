"use client"

import * as React from "react"
import Link from "next/link"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiDownload2Line,
  RiInboxLine,
  RiSearchLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { deleteResponses } from "@/app/(app)/forms/[id]/responses/actions"
import { ResponseDrawer, submittedAt } from "@/components/responses/response-drawer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatAnswer } from "@/lib/fields/display"
import type { Answers, Field } from "@/lib/fields/types"
import { filtersToParams, hasFilters, type ResponseFilters } from "@/lib/responses/filters"
import { cn } from "@/lib/utils"

export type FilterField = { id: string; label: string; values: { value: string; label: string }[] }

type Page = {
  rows: { id: string; createdAt: string; answers: Answers }[]
  total: number
  page: number
  pageSize: number
  pageCount: number
}

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-KE")} ${n === 1 ? one : many}`

async function fetchPage(formId: string, filters: ResponseFilters, page: number): Promise<Page> {
  const sp = filtersToParams(filters)
  sp.set("page", String(page))
  const res = await fetch(`/api/forms/${formId}/responses?${sp}`)
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Couldn’t load responses.")
  return res.json()
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

// Responses (§9.8): server-side pagination (25/page), search, date + choice
// filters, drawer, single/bulk delete, CSV export of the current view.
export function ResponsesView({
  formId,
  columns,
  filterFields,
  totalAll,
  initialFilters,
  initialPage,
  initialResponseId,
}: {
  formId: string
  columns: Field[]
  filterFields: FilterField[]
  totalAll: number
  initialFilters: ResponseFilters
  initialPage: number
  initialResponseId: string | null
}) {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState(initialFilters.q ?? "")
  const q = useDebounced(search.trim(), 300)
  const [dates, setDates] = React.useState({ from: initialFilters.from ?? "", to: initialFilters.to ?? "" })
  const [choice, setChoice] = React.useState({ field: initialFilters.field ?? "", value: initialFilters.value ?? "" })
  const [page, setPage] = React.useState(initialPage)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [openId, setOpenId] = React.useState<string | null>(initialResponseId)
  const [confirm, setConfirm] = React.useState<string[] | null>(null)

  const filters: ResponseFilters = React.useMemo(
    () => ({
      q: q || undefined,
      from: dates.from || undefined,
      to: dates.to || undefined,
      field: choice.field && choice.value ? choice.field : undefined,
      value: choice.field && choice.value ? choice.value : undefined,
    }),
    [q, dates, choice]
  )
  const filterKey = filtersToParams(filters).toString()

  // New filters → back to page 1 and a fresh selection (derived-state reset).
  const [lastKey, setLastKey] = React.useState(filterKey)
  if (lastKey !== filterKey) {
    setLastKey(filterKey)
    setPage(1)
    setSelected(new Set())
  }

  // Mirror state into the URL so reloads/back keep the view (no server round-trip).
  React.useEffect(() => {
    const sp = filtersToParams(filters)
    if (page > 1) sp.set("page", String(page))
    if (openId) sp.set("r", openId)
    const qs = sp.toString()
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname)
  }, [filters, page, openId])

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["responses", formId, filterKey, page],
    queryFn: () => fetchPage(formId, filters, page),
    placeholderData: keepPreviousData,
  })

  const remove = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await deleteResponses(formId, ids)
      if (!res.ok) throw new Error(res.error)
      return res.deleted
    },
    onSuccess: (deleted, ids) => {
      toast.success(`${plural(deleted, "response")} deleted`)
      setSelected(new Set())
      setConfirm(null)
      if (openId && ids.includes(openId)) setOpenId(null)
      void queryClient.invalidateQueries({ queryKey: ["responses", formId] })
    },
    onError: (err) => toast.error(err.message),
  })

  const rows = data?.rows ?? []
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const filtered = hasFilters(filters)
  const exportHref = `/api/export/${formId}${filterKey ? `?${filterKey}` : ""}`
  const activeFilterField = filterFields.find((f) => f.id === choice.field)

  function toggle(id: string, on: boolean) {
    setSelected((s) => {
      const next = new Set(s)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function clearFilters() {
    setSearch("")
    setDates({ from: "", to: "" })
    setChoice({ field: "", value: "" })
  }

  if (totalAll === 0 && !filtered) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-card bg-surface p-12 text-center shadow-card">
        <div className="grid size-12 place-items-center rounded-[14px] bg-brand-tint">
          <RiInboxLine className="size-[22px] text-brand" aria-hidden />
        </div>
        <h2 className="h3">No responses yet</h2>
        <p className="max-w-sm">Share your form’s link or QR code — responses will appear here as they arrive.</p>
        <Button asChild size="lg">
          <Link href={`/forms/${formId}/share`}>Share your form</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header: count + export */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Responses</p>
          <p className="mt-3 text-[28px] leading-none font-bold tracking-[-0.02em] text-ink" aria-live="polite">
            {data ? (filtered ? `${plural(data.total, "match", "matches")}` : plural(data.total, "response")) : plural(totalAll, "response")}
          </p>
        </div>
        <Button asChild size="lg" variant="outline" className="bg-surface">
          <a href={exportHref} download>
            <RiDownload2Line data-icon="inline-start" /> Export CSV
          </a>
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 rounded-card bg-surface p-4 shadow-card md:flex-row md:flex-wrap md:items-end">
        <div className="relative min-w-0 flex-1 md:min-w-64">
          <RiSearchLine className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <Input
            type="search"
            aria-label="Search responses"
            placeholder="Search answers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 bg-surface pl-10 text-base"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
            From
            <Input type="date" value={dates.from} max={dates.to || undefined} onChange={(e) => setDates((d) => ({ ...d, from: e.target.value }))} className="h-11 bg-surface text-base" />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink">
            To
            <Input type="date" value={dates.to} min={dates.from || undefined} onChange={(e) => setDates((d) => ({ ...d, to: e.target.value }))} className="h-11 bg-surface text-base" />
          </label>
        </div>
        {filterFields.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <Select value={choice.field || "__none"} onValueChange={(v) => setChoice({ field: v === "__none" ? "" : v, value: "" })}>
              <SelectTrigger className="h-11 w-full min-w-0 bg-surface md:w-44" aria-label="Filter by question">
                <SelectValue placeholder="Filter by…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Any question</SelectItem>
                {filterFields.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={choice.value} onValueChange={(v) => setChoice((c) => ({ ...c, value: v }))} disabled={!activeFilterField}>
              <SelectTrigger className="h-11 w-full min-w-0 bg-surface md:w-44" aria-label="Answer">
                <SelectValue placeholder="Answer…" />
              </SelectTrigger>
              <SelectContent>
                {activeFilterField?.values.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {filtered && (
          <Button variant="ghost" onClick={clearFilters} className="h-11">
            <RiCloseLine data-icon="inline-start" /> Clear
          </Button>
        )}
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-card bg-dark px-5 py-3 text-dark-text shadow-float" role="region" aria-label="Selection">
          <span className="text-[14px] font-semibold">{plural(selected.size, "response")} selected</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-dark-text hover:bg-dark-panel" onClick={() => setSelected(new Set())}>
              Cancel
            </Button>
            <Button variant="inverse" size="sm" onClick={() => setConfirm([...selected])}>
              <RiDeleteBinLine data-icon="inline-start" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={cn("overflow-hidden rounded-card bg-surface shadow-card transition-opacity", isFetching && !isPending && "opacity-70")}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 pl-5">
                  <Checkbox
                    aria-label="Select all on this page"
                    checked={allOnPage}
                    onCheckedChange={(on) => rows.forEach((r) => toggle(r.id, !!on))}
                    disabled={!rows.length}
                  />
                </TableHead>
                {columns.map((c) => (
                  <TableHead key={c.id} className="max-w-56 min-w-36 truncate text-[13px] font-bold text-ink">
                    {c.label || "Untitled question"}
                  </TableHead>
                ))}
                <TableHead className="min-w-40 pr-5 text-[13px] font-bold text-ink">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending &&
                Array.from({ length: 8 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-5">
                      <Skeleton className="size-4" />
                    </TableCell>
                    {columns.map((c) => (
                      <TableCell key={c.id}>
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                  </TableRow>
                ))}
              {rows.map((r) => (
                <TableRow
                  key={r.id}
                  data-state={selected.has(r.id) ? "selected" : undefined}
                  className="cursor-pointer"
                  onClick={() => setOpenId(r.id)}
                >
                  <TableCell className="pl-5" onClick={(e) => e.stopPropagation()}>
                    <Checkbox aria-label={`Select response from ${submittedAt(r.createdAt)}`} checked={selected.has(r.id)} onCheckedChange={(on) => toggle(r.id, !!on)} />
                  </TableCell>
                  {columns.map((c, i) => (
                    <TableCell key={c.id} className="max-w-56 truncate text-[14px] text-ink">
                      {i === 0 ? (
                        // Keyboard + screen reader entry point for the row.
                        <button type="button" className="max-w-full truncate text-left font-semibold outline-none focus-visible:underline" onClick={() => setOpenId(r.id)}>
                          {formatAnswer(c, r.answers[c.id])}
                          <span className="sr-only">, view response</span>
                        </button>
                      ) : (
                        formatAnswer(c, r.answers[c.id])
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="pr-5 text-[14px] whitespace-nowrap text-ink-muted">{submittedAt(r.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {error && <p className="px-5 py-8 text-center text-destructive!">{error.message}</p>}
        {data && rows.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
            <p className="font-semibold text-ink!">No responses match these filters.</p>
            <Button variant="outline" onClick={clearFilters} className="bg-surface">
              Clear filters
            </Button>
          </div>
        )}

        {data && data.pageCount > 1 && (
          <nav className="flex items-center justify-between gap-3 border-t border-line px-5 py-3" aria-label="Pagination">
            <p className="text-[14px]">
              Page {data.page.toLocaleString("en-KE")} of {data.pageCount.toLocaleString("en-KE")}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-surface" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <RiArrowLeftSLine data-icon="inline-start" /> Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-surface" disabled={page >= data.pageCount} onClick={() => setPage((p) => p + 1)}>
                Next <RiArrowRightSLine data-icon="inline-end" />
              </Button>
            </div>
          </nav>
        )}
      </div>

      <ResponseDrawer
        formId={formId}
        responseId={openId}
        onClose={() => setOpenId(null)}
        onDelete={(id) => setConfirm([id])}
        deleting={remove.isPending}
      />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirm && confirm.length > 1 ? plural(confirm.length, "response") : "this response"}?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the answers and any uploaded files. It can’t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={remove.isPending} onClick={() => confirm && remove.mutate(confirm)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
