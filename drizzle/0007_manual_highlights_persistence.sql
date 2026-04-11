CREATE TABLE IF NOT EXISTS "highlight_items" (
  "id" text PRIMARY KEY NOT NULL,
  "resource_id" text NOT NULL,
  "resource_type" text NOT NULL,
  "title" text NOT NULL,
  "image" text,
  "priority" integer DEFAULT 0 NOT NULL,
  "created_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "highlight_items" ADD CONSTRAINT "highlight_items_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "highlight_items_resource_unique" ON "highlight_items" USING btree ("resource_id","resource_type");
