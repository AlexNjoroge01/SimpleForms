ALTER TABLE "uploads" DROP COLUMN "public_id";--> statement-breakpoint
ALTER TABLE "uploads" DROP COLUMN "url";--> statement-breakpoint
ALTER TABLE "uploads" DROP COLUMN "format";--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "uploads" ADD COLUMN "content_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_key_unique" UNIQUE("key");