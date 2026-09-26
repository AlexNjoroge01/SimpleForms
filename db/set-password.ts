import "dotenv/config"

import bcrypt from "bcryptjs"
import { sql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "@/db/schema"

// Sets an account's password from the command line (e.g. for a seeded admin).
//   pnpm db:set-password <email> '<password>'
// Quote the password so the shell doesn't expand characters like $.
// Never commit a real password to this file or to package.json.

async function main() {
  const [rawEmail, password] = process.argv.slice(2)
  if (!rawEmail || !password) throw new Error("Usage: pnpm db:set-password <email> '<password>'")
  if (password.length < 8 || password.length > 72) throw new Error("Password must be 8–72 characters.")
  const email = rawEmail.trim().toLowerCase()

  const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 })
  const db = drizzle(client, { schema })

  const updated = await db
    .update(schema.users)
    .set({ passwordHash: await bcrypt.hash(password, 12) })
    .where(sql`lower(${schema.users.email}) = ${email}`)
    .returning({ email: schema.users.email })

  console.log(updated.length ? `✓ Password updated for ${email}` : `✗ No account for ${email}.`)
  await client.end()
  if (!updated.length) process.exit(1)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
