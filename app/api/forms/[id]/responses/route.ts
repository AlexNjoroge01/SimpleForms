import type { NextRequest } from "next/server"

import { apiUser } from "@/lib/auth"
import { getOwnedForm } from "@/lib/forms"
import { parseFilters } from "@/lib/responses/filters"
import { listResponses, PAGE_SIZE } from "@/lib/responses/query"

// Paginated responses for the table (§9.8, 25/page). Owner-only.
export async function GET(req: NextRequest, ctx: RouteContext<"/api/forms/[id]/responses">) {
  const user = await apiUser()
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 })
  const { id } = await ctx.params
  const form = await getOwnedForm(id, user.id)
  if (!form) return Response.json({ error: "Form not found." }, { status: 404 })

  const sp = req.nextUrl.searchParams
  const page = Math.max(1, Math.min(100_000, Number.parseInt(sp.get("page") ?? "1", 10) || 1))
  const { rows, total } = await listResponses(form.id, parseFilters(sp), page)

  return Response.json(
    { rows, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
    { headers: { "Cache-Control": "private, no-store" } }
  )
}
