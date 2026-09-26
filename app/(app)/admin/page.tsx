import type { Metadata } from "next"
import {
  RiFileList3Line,
  RiInboxArchiveLine,
  RiPulseLine,
  RiUserAddLine,
  RiUserLine,
  RiBarChartBoxLine,
} from "@remixicon/react"

import { SignupChart } from "@/components/admin/signup-chart"
import { StatTile } from "@/components/admin/stat-tile"
import { Badge } from "@/components/ui/badge"
import { getAdminStats, SIGNUP_DAYS } from "@/lib/admin"
import { requireAdmin } from "@/lib/auth"

export const metadata: Metadata = { title: "Admin", robots: { index: false } }

const joined = new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Nairobi" })

// Beta usage at a glance: who signed up, who is building, what's being collected.
export default async function AdminPage() {
  await requireAdmin()
  const stats = await getAdminStats()

  return (
    <div className="container-site flex flex-col gap-8 py-12">
      <div>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-3 text-[34px] leading-[1.05] font-bold tracking-[-0.03em]">Usage</h1>
        <p className="mt-2">How many people are using SimpleForms during the free beta.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          icon={RiUserLine}
          label="Total users"
          value={stats.users.total}
          detail={`${stats.forms.creators} have created at least one form`}
        />
        <StatTile icon={RiUserAddLine} label="New users, last 7 days" value={stats.users.last7} detail={`${stats.users.last30} in the last 30 days`} />
        <StatTile icon={RiPulseLine} label="Active creators, last 30 days" value={stats.activeCreators30} detail="Edited a form in the last 30 days" />
        <StatTile icon={RiFileList3Line} label="Forms" value={stats.forms.total} detail={`${stats.forms.published} published`} />
        <StatTile icon={RiInboxArchiveLine} label="Responses collected" value={stats.responses.total} detail={`${stats.responses.last7} in the last 7 days`} />
        <StatTile
          icon={RiBarChartBoxLine}
          label="Avg. responses per form"
          value={stats.forms.total ? Math.round(stats.responses.total / stats.forms.total) : 0}
          detail="Across all forms"
        />
      </div>

      <section aria-labelledby="signups-title" className="flex flex-col gap-4 rounded-card bg-surface p-6 shadow-card sm:p-8">
        <h2 id="signups-title" className="h3">
          Sign-ups per day, last {SIGNUP_DAYS} days
        </h2>
        <SignupChart data={stats.signupsByDay} />
      </section>

      <section aria-labelledby="users-title" className="flex flex-col gap-4 rounded-card bg-surface p-6 shadow-card sm:p-8">
        <div>
          <h2 id="users-title" className="h3">
            Recent users
          </h2>
          <p className="mt-1 text-[15px]">The latest {stats.recentUsers.length} sign-ups, newest first.</p>
        </div>
        <div className="-mx-6 overflow-x-auto px-6 sm:-mx-8 sm:px-8">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead>
              <tr className="border-b border-line text-[12px] font-bold tracking-[0.06em] text-ink-muted uppercase">
                <th scope="col" className="py-3 pr-4">User</th>
                <th scope="col" className="py-3 pr-4">Joined</th>
                <th scope="col" className="py-3 pr-4">Sign-in</th>
                <th scope="col" className="py-3 pr-4 text-right">Forms</th>
                <th scope="col" className="py-3 text-right">Responses</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2 font-semibold text-ink">
                      {u.name ?? "—"}
                      {u.isAdmin && <Badge variant="secondary">Admin</Badge>}
                    </div>
                    <div className="text-ink-muted">{u.email}</div>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-ink-muted">{joined.format(u.createdAt)}</td>
                  <td className="py-3 pr-4 text-ink-muted">{u.google ? "Google" : "Email"}</td>
                  <td className="py-3 pr-4 text-right text-ink tabular-nums">{u.forms}</td>
                  <td className="py-3 text-right text-ink tabular-nums">{u.responses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
