import "server-only"

import { z } from "zod"

/**
 * Server env, validated once at import. Values prefixed with "mock_" are
 * placeholders — use `isConfigured()` before calling the matching service so
 * features degrade gracefully (e.g. emails are logged instead of sent).
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  AWS_ENDPOINT_URL_S3: z.url(),
  AWS_REGION: z.string().min(1).default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  CRON_SECRET: z.string().min(16),
  IP_HASH_SALT: z.string().min(16),
})

export const env = schema.parse(process.env)

type Service = "database" | "google" | "storage" | "resend"

const serviceKeys: Record<Service, (keyof typeof env)[]> = {
  database: ["DATABASE_URL"],
  google: ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"],
  storage: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
  resend: ["RESEND_API_KEY"],
}

export function isConfigured(service: Service): boolean {
  return serviceKeys[service].every((key) => !String(env[key]).includes("mock_"))
}

export const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
