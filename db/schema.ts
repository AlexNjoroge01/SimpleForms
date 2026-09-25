import { createId } from "@paralleldrive/cuid2"
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

import type { Answers, Field, FormSettings } from "@/lib/fields/types"

// Data model (Blueprint §5). Tables are snake_case; TS properties camelCase.

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId())

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

export const emailNotificationEnum = pgEnum("email_notifications", [
  "NONE",
  "EACH_SUBMISSION",
  "DAILY_DIGEST",
])

export const formStatusEnum = pgEnum("form_status", ["DRAFT", "PUBLISHED", "CLOSED"])

// --- Users + NextAuth tables ------------------------------------------------

export const users = pgTable("users", {
  id: id(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: text("image"),
  passwordHash: text("password_hash"),
  emailNotifications: emailNotificationEnum("email_notifications")
    .notNull()
    .default("EACH_SUBMISSION"),
  ...timestamps,
})

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
)

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
})

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
)

// --- Forms --------------------------------------------------------------------

export const forms = pgTable(
  "forms",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    slug: text("slug"),
    status: formStatusEnum("status").notNull().default("DRAFT"),
    fields: jsonb("fields").$type<Field[]>().notNull().default([]),
    publishedFields: jsonb("published_fields").$type<Field[]>(),
    settings: jsonb("settings").$type<FormSettings>().notNull(),
    responseCount: integer("response_count").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("forms_user_updated_idx").on(t.userId, t.updatedAt),
    uniqueIndex("forms_slug_idx").on(t.slug),
  ]
)

// --- Responses ------------------------------------------------------------------

export type ResponseMetadata = { userAgent?: string; referrer?: string; ipHash?: string }

export const responses = pgTable(
  "responses",
  {
    id: id(),
    formId: text("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    answers: jsonb("answers").$type<Answers>().notNull(),
    fieldsSnapshot: jsonb("fields_snapshot").$type<Field[]>().notNull(),
    metadata: jsonb("metadata").$type<ResponseMetadata>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("responses_form_created_idx").on(t.formId, t.createdAt)]
)

// --- Uploads --------------------------------------------------------------------

export const uploads = pgTable(
  "uploads",
  {
    id: id(),
    formId: text("form_id")
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    responseId: text("response_id").references(() => responses.id, { onDelete: "cascade" }),
    fieldId: text("field_id").notNull(),
    // Neon Object Storage key — the file itself never lives in Postgres.
    key: text("key").notNull().unique(),
    contentType: text("content_type").notNull(),
    bytes: integer("bytes").notNull(),
    originalName: text("original_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("uploads_orphan_idx").on(t.responseId, t.createdAt),
    index("uploads_form_idx").on(t.formId),
  ]
)

// --- Rate limiting (in-DB fixed-window counter, Blueprint §7.3 / §10) -----------

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type Form = typeof forms.$inferSelect
export type NewForm = typeof forms.$inferInsert
export type FormResponse = typeof responses.$inferSelect
export type Upload = typeof uploads.$inferSelect
