CREATE TABLE IF NOT EXISTS "activity_logs" (
  "id" text PRIMARY KEY,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text,
  "details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "timestamp" timestamp DEFAULT now() NOT NULL,
  "ip_address" text,
  "role" text
);

CREATE TABLE IF NOT EXISTS "announcements" (
  "id" text PRIMARY KEY,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "target_roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "send_email" boolean DEFAULT false NOT NULL,
  "send_notification" boolean DEFAULT true NOT NULL,
  "created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
