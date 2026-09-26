import { apiUser } from "@/lib/auth"
import { getOwnedForm } from "@/lib/forms"
import { getResponse } from "@/lib/responses/query"

// One full submission for the drawer: labels from its own fields snapshot (§9.8).
export async function GET(_req: Request, ctx: RouteContext<"/api/forms/[id]/responses/[rid]">) {
  const user = await apiUser()
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 })
  const { id, rid } = await ctx.params
  const form = await getOwnedForm(id, user.id)
  if (!form) return Response.json({ error: "Form not found." }, { status: 404 })

  const response = await getResponse(form.id, rid)
  if (!response) return Response.json({ error: "Response not found." }, { status: 404 })

  return Response.json(
    {
      id: response.id,
      createdAt: response.createdAt,
      fields: response.fieldsSnapshot,
      answers: response.answers,
      files: response.files.map((f) => ({
        id: f.id,
        fieldId: f.fieldId,
        name: f.originalName ?? "file",
        bytes: f.bytes,
        contentType: f.contentType,
        url: `/api/files/${f.id}`,
      })),
    },
    { headers: { "Cache-Control": "private, no-store" } }
  )
}
