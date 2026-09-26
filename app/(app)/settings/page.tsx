import type { Metadata } from "next"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"

import { users } from "@/db/schema"
import { DeleteAccount, ProfileForm } from "@/components/app/settings-forms"
import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"

export const metadata: Metadata = { title: "Settings" }

// §9.9: name, email notification preference, delete account.
export default async function SettingsPage() {
  const session = await requireUser()
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.id),
    columns: { name: true, email: true, emailNotifications: true },
  })
  if (!user) notFound()

  return (
    <div className="container-site flex max-w-3xl flex-col gap-8 py-12">
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="mt-3 text-[34px] leading-[1.05] font-bold tracking-[-0.03em]">Settings</h1>
      </div>
      <ProfileForm name={user.name ?? ""} email={user.email} emailNotifications={user.emailNotifications} />
      <DeleteAccount email={user.email} />
    </div>
  )
}
