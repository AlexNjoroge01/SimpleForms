import "server-only"

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "@/db/schema"
import { env } from "@/lib/env"

// Reuse one connection pool across hot reloads in dev.
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql }

const client =
  globalForDb.pgClient ??
  postgres(env.DATABASE_URL, {
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    prepare: false, // required for Neon's pooled (pgbouncer) endpoint
  })

if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client

export const db = drizzle(client, { schema })
export { schema }
