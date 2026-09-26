import type { NextRequest } from "next/server"
import { z } from "zod"

import { formatBytes, isAllowedType, ACCEPT_LABEL } from "@/lib/fields/files"
import { clientIp, hashIp } from "@/lib/server/ip"
import { LIMITS, rateLimit } from "@/lib/server/rate-limit"
import { issueUploadToken } from "@/lib/server/upload-token"
import { baseUploadSchema, maxBytes, resolveUploadTarget } from "@/lib/server/uploads"
import { signUpload, uploadKey } from "@/lib/storage"

// Step 1 of a public upload: validate the field's rules and hand out a
// presigned POST (size enforced by storage) + a token for the complete step.

const schema = baseUploadSchema.extend({
  name: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(127),
  size: z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Invalid upload request." }, { status: 400 })
  const { slug, fieldId, name, type, size } = parsed.data

  const target = await resolveUploadTarget(slug, fieldId)
  if (!target.ok) return target.response
  const { form, field } = target

  const accept = field.config?.accept ?? "any"
  if (!isAllowedType(accept, type))
    return Response.json({ error: `Please choose ${ACCEPT_LABEL[accept].toLowerCase()} only.` }, { status: 415 })
  const limit = maxBytes(field)
  if (size > limit) return Response.json({ error: `Files must be ${formatBytes(limit)} or smaller.` }, { status: 413 })

  const rl = await rateLimit(`upload:${slug}:${hashIp(clientIp(req.headers))}`, LIMITS.uploadSign.limit, LIMITS.uploadSign.windowSec)
  if (!rl.ok)
    return Response.json({ error: "Too many uploads. Please try again in a few minutes." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } })

  const key = uploadKey(form.id, name)
  const upload = await signUpload(key, { maxBytes: limit, contentType: type })
  return Response.json({ key, token: issueUploadToken(form.id, field.id, key), upload })
}
