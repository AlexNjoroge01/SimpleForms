import "dotenv/config"

import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "@/db/schema"
import { choiceLabels } from "@/lib/fields/registry"
import { DEFAULT_FORM_SETTINGS, type Answers, type Field } from "@/lib/fields/types"
import { KENYA_COUNTIES } from "@/lib/kenya/counties"
import { newSlug } from "@/lib/slug"
import { getTemplate, instantiateTemplate } from "@/lib/templates"

// Seed (Blueprint §18): demo user, 3 published forms, 1,000 responses.
//   pnpm db:seed          → log in as demo@simpleforms.test / demo-pass-123
// Re-running replaces the demo user and everything they own.

const DEMO = { email: "demo@simpleforms.test", password: "demo-pass-123", name: "Demo Wanjiru" }
const PLAN = [
  { template: "event-registration", responses: 600 },
  { template: "customer-feedback", responses: 250 },
  { template: "order-form", responses: 150 },
]
const DAYS = 60
const BATCH = 250

const FIRST = ["Wanjiku", "Otieno", "Achieng", "Kamau", "Njeri", "Mwangi", "Chebet", "Kiprono", "Akinyi", "Mutua", "Wambui", "Omondi", "Nekesa", "Barasa", "Zawadi", "Hassan", "Amina", "Juma", "Wairimu", "Ngugi"]
const LAST = ["Kamau", "Odhiambo", "Wanjala", "Mutiso", "Kiplagat", "Njoroge", "Onyango", "Mohamed", "Ochieng", "Kariuki", "Muthoni", "Were", "Cheruiyot", "Ali", "Nyambura"]
const ORGS = ["Safaricom", "KCB Group", "Equity Bank", "Andela", "iHub", "Twiga Foods", "M-KOPA", "University of Nairobi", "Strathmore", "Kenya Power", "Self-employed"]
const NOTES = [
  "Great event, looking forward to the next one.",
  "Please share the slides afterwards.",
  "Vegetarian meal please.",
  "Delivery after 5pm works best.",
  "Service was quick and friendly.",
  "Parking was a bit difficult.",
  "Call me before delivery.",
  "Asante sana!",
]
const PREFIXES = ["710", "711", "712", "713", "720", "721", "722", "723", "740", "741", "745", "757", "758", "768", "790", "795", "110", "111", "112", "115"]

let seed = 42
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32)
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]
const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))

function answerFor(f: Field, person: { first: string; last: string }): Answers[string] | undefined {
  if (!f.required && rand() < 0.3) return undefined
  const label = f.label.toLowerCase()
  switch (f.type) {
    case "short_text":
      if (/name/.test(label)) return `${person.first} ${person.last}`
      if (/organisation|company/.test(label)) return pick(ORGS)
      if (/location/.test(label)) return pick(["Kilimani, Argwings Kodhek Rd", "Westlands, Mpaka Rd", "Nyali, Links Rd", "Milimani, Kisumu"])
      return pick(ORGS)
    case "long_text":
      return pick(NOTES)
    case "email":
      return `${person.first}.${person.last}${int(1, 99)}@example.co.ke`.toLowerCase()
    case "phone":
      return `+254${pick(PREFIXES)}${String(int(0, 999999)).padStart(6, "0")}`
    case "number": {
      const min = f.config?.min ?? 1
      const max = f.config?.max ?? (f.config?.currency ? 20000 : 10)
      const n = int(Math.max(min, 1), Math.min(max, f.config?.currency ? 20000 : 10))
      return f.config?.currency ? Math.round(n / 50) * 50 : n
    }
    case "single_choice":
    case "dropdown":
      return pick(f.config?.preset ? KENYA_COUNTIES : choiceLabels(f))
    case "multiple_choice": {
      const labels = choiceLabels(f)
      const n = int(1, Math.min(3, labels.length))
      return [...labels].sort(() => rand() - 0.5).slice(0, n)
    }
    case "date": {
      const d = new Date(Date.now() + int(-30, 30) * 86_400_000)
      return d.toISOString().slice(0, 10)
    }
    case "yes_no":
      return rand() < 0.6 ? "yes" : "no"
    case "file_upload":
      return undefined
  }
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 })
  const db = drizzle(client, { schema })

  await db.delete(schema.users).where(eq(schema.users.email, DEMO.email))
  const [user] = await db
    .insert(schema.users)
    .values({ email: DEMO.email, name: DEMO.name, passwordHash: await bcrypt.hash(DEMO.password, 12) })
    .returning({ id: schema.users.id })

  for (const plan of PLAN) {
    const t = getTemplate(plan.template)!
    const fields = instantiateTemplate(t)
    const [form] = await db
      .insert(schema.forms)
      .values({
        userId: user.id,
        title: t.title,
        description: t.description,
        slug: newSlug(),
        status: "PUBLISHED",
        fields,
        publishedFields: fields,
        publishedTitle: t.title,
        publishedDescription: t.description,
        settings: { ...DEFAULT_FORM_SETTINGS, ...t.settings },
        responseCount: plan.responses,
        publishedAt: new Date(Date.now() - DAYS * 86_400_000),
      })
      .returning({ id: schema.forms.id, slug: schema.forms.slug })

    const rows = Array.from({ length: plan.responses }, () => {
      const person = { first: pick(FIRST), last: pick(LAST) }
      const answers: Answers = {}
      for (const f of fields) {
        const a = answerFor(f, person)
        if (a !== undefined) answers[f.id] = a
      }
      return {
        formId: form.id,
        answers,
        fieldsSnapshot: fields,
        metadata: { userAgent: "seed" },
        createdAt: new Date(Date.now() - rand() * DAYS * 86_400_000),
      }
    })
    for (let i = 0; i < rows.length; i += BATCH) await db.insert(schema.responses).values(rows.slice(i, i + BATCH))
    console.log(`✓ ${t.title}: ${plan.responses} responses → /f/${form.slug}`)
  }

  console.log(`\nLog in as ${DEMO.email} / ${DEMO.password}`)
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
