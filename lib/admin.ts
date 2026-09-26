import "server-only"

import { count, desc, gte, sql } from "drizzle-orm"

import { accounts, forms, responses, users } from "@/db/schema"
import { db } from "@/lib/db"

// Usage numbers for /admin. Every query is a plain aggregate — fine at beta
// scale; add indexes on users.created_at if sign-ups grow into the 100k range.

const TZ = "Africa/Nairobi"
export const SIGNUP_DAYS = 30

const daysAgo = (n: number) => sql`now() - make_interval(days => ${n})`

export async function getAdminStats() {
  const [
    [userTotals],
    [creators],
    [formTotals],
    [responseTotals],
    signupRows,
    recentUsers,
  ] = await Promise.all([
    db
      .select({
        total: count(),
        last7: sql<number>`count(*) filter (where ${users.createdAt} >= ${daysAgo(7)})::int`,
        last30: sql<number>`count(*) filter (where ${users.createdAt} >= ${daysAgo(30)})::int`,
      })
      .from(users),
    // "Active" = edited a form in the last 30 days.
    db
      .select({ active30: sql<number>`count(distinct ${forms.userId})::int` })
      .from(forms)
      .where(gte(forms.updatedAt, daysAgo(30))),
    db
      .select({
        total: count(),
        published: sql<number>`count(*) filter (where ${forms.status} = 'PUBLISHED')::int`,
        creators: sql<number>`count(distinct ${forms.userId})::int`,
      })
      .from(forms),
    db
      .select({
        total: count(),
        last7: sql<number>`count(*) filter (where ${responses.createdAt} >= ${daysAgo(7)})::int`,
      })
      .from(responses),
    // One row per day (Nairobi time), zero-filled, oldest first.
    db.execute<{ day: string; signups: number }>(sql`
      select to_char(d.day, 'YYYY-MM-DD') as day, count(u.id)::int as signups
      from generate_series(
        date_trunc('day', now() at time zone ${TZ}) - make_interval(days => ${SIGNUP_DAYS - 1}),
        date_trunc('day', now() at time zone ${TZ}),
        interval '1 day'
      ) as d(day)
      left join ${users} u on date_trunc('day', u.created_at at time zone ${TZ}) = d.day
      group by d.day
      order by d.day
    `),
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
        isAdmin: users.isAdmin,
        google: sql<boolean>`exists (select 1 from ${accounts} where ${accounts.userId} = ${users.id} and ${accounts.provider} = 'google')`,
        forms: sql<number>`(select count(*) from ${forms} where ${forms.userId} = ${users.id})::int`,
        responses: sql<number>`(select coalesce(sum(${forms.responseCount}), 0) from ${forms} where ${forms.userId} = ${users.id})::int`,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(50),
  ])

  return {
    users: userTotals,
    activeCreators30: creators.active30,
    forms: formTotals,
    responses: responseTotals,
    signupsByDay: Array.from(signupRows, (r) => ({ day: r.day, signups: Number(r.signups) })),
    recentUsers,
  }
}

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>

