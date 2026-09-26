import type { Metadata } from "next"

import { FormNav } from "@/components/app/form-nav"
import { ResponsesView, type FilterField } from "@/components/responses/responses-view"
import { choiceLabels } from "@/lib/fields/registry"
import type { Field } from "@/lib/fields/types"
import { getMyFormOr404, responseFields } from "@/lib/forms"
import { parseFilters } from "@/lib/responses/filters"

export const metadata: Metadata = { title: "Responses" }

const MAX_COLUMNS = 4

/** Choice-like questions offered in the "filter by answer" control. */
function filterFieldsOf(fields: Field[]): FilterField[] {
  return fields.flatMap((f) => {
    if (f.type === "yes_no")
      return [{ id: f.id, label: f.label, values: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] }]
    if (f.type === "single_choice" || f.type === "multiple_choice" || f.type === "dropdown")
      return [{ id: f.id, label: f.label, values: choiceLabels(f).filter(Boolean).map((l) => ({ value: l, label: l })) }]
    return []
  })
}

export default async function ResponsesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const sp = await searchParams
  const form = await getMyFormOr404(id)
  const fields = responseFields(form)

  const flat = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])))
  const page = Math.max(1, Number.parseInt(flat.get("page") ?? "1", 10) || 1)

  return (
    <>
      <FormNav form={form} active="responses" />
      <div className="container-site py-10">
        <ResponsesView
          formId={form.id}
          columns={fields.filter((f) => f.type !== "file_upload").slice(0, MAX_COLUMNS)}
          filterFields={filterFieldsOf(fields)}
          totalAll={form.responseCount}
          initialFilters={parseFilters(flat)}
          initialPage={page}
          initialResponseId={flat.get("r")}
        />
      </div>
    </>
  )
}
