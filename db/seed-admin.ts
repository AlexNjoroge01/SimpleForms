import "dotenv/config"

import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "@/db/schema"

// Grants /admin to an existing account.
//   pnpm db:seed-admin                   → alexnjoroge102@gmail.com
//   pnpm db:seed-admin someone@example.com
// The account must sign up first; re-running is safe.

const DEFAULT_ADMIN = "alexnjoroge102@gmail.com"

async function main() {
  const email = (process.argv[2] ?? DEFAULT_ADMIN).trim().toLowerCase()
  const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 })
  const db = drizzle(client, { schema })

  const updated = await db
    .update(schema.users)
    .set({ isAdmin: true })
    .where(sql`lower(${schema.users.email}) = ${email}`)
    .returning({ email: schema.users.email })

  console.log(
    updated.length
      ? `✓ ${email} is now an admin → /admin`
      : `✗ No account for ${email}. Sign up first, then re-run this.`
  )
  await client.end()
  if (!updated.length) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
