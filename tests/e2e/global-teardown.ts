import "dotenv/config"

import postgres from "postgres"

// E2E runs sign up throwaway users (e2e-*@example.test); remove them and their forms (cascade).
export default async function globalTeardown() {
  if (!process.env.DATABASE_URL) return
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 })
  try {
    const rows = await sql`delete from users where email like 'e2e-%@example.test' returning id`
    console.log(`[e2e] removed ${rows.length} test users`)
  } finally {
    await sql.end()
  }
}
