/**
 * Key-order-insensitive JSON (undefined keys dropped). Postgres jsonb reorders
 * keys, so drafts and snapshots must be compared canonically.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v)
            .filter(([, x]) => x !== undefined)
            .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        )
      : v
  )
}
