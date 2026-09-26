import { and, eq } from "drizzle-orm"
import type { NextRequest } from "next/server"

import { forms, uploads } from "@/db/schema"
import { apiUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { IMAGE_TYPES } from "@/lib/fields/files"
import { downloadUrl } from "@/lib/storage"

/**
 * Owner-only file access: redirects to a short-lived presigned URL. Stable
 * links (used in the drawer and CSV exports) never expose storage URLs that
 * outlive the session. `?inline=1` previews raster images in the browser.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/files/[uploadId]">) {
  const user = await apiUser()
  if (!user) return new Response("Sign in required.", { status: 401 })
  const { uploadId } = await ctx.params

  const [file] = await db
    .select({ key: uploads.key, name: uploads.originalName, contentType: uploads.contentType })
    .from(uploads)
    .innerJoin(forms, eq(forms.id, uploads.formId))
    .where(and(eq(uploads.id, uploadId), eq(forms.userId, user.id)))
  if (!file) return new Response("File not found.", { status: 404 })

  const inline = req.nextUrl.searchParams.get("inline") === "1" && IMAGE_TYPES.includes(file.contentType)
  const url = await downloadUrl(file.key, file.name, { expiresIn: 60 * 10, inline })
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, no-store" } })
}
