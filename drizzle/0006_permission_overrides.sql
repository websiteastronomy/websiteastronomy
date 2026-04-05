CREATE TABLE IF NOT EXISTS "user_permissions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "permission_key" text NOT NULL,
  "allowed" boolean NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_permissions_user_permission_unique"
  ON "user_permissions" ("user_id", "permission_key");

CREATE TABLE IF NOT EXISTS "resource_permissions" (
  "id" text PRIMARY KEY NOT NULL,
  "resource_id" text NOT NULL REFERENCES "project_files"("id") ON DELETE CASCADE,
  "resource_type" text NOT NULL,
  "role" text NOT NULL,
  "can_view" boolean DEFAULT true NOT NULL,
  "can_edit" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "resource_permissions_resource_role_unique"
  ON "resource_permissions" ("resource_id", "role");
