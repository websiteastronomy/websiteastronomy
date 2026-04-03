ALTER TABLE "articles"
  ADD COLUMN IF NOT EXISTS "is_highlighted" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "highlight_priority" integer DEFAULT 0 NOT NULL;

ALTER TABLE "observations"
  ADD COLUMN IF NOT EXISTS "is_highlighted" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "highlight_priority" integer DEFAULT 0 NOT NULL;

ALTER TABLE "events"
  ADD COLUMN IF NOT EXISTS "is_highlighted" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "highlight_priority" integer DEFAULT 0 NOT NULL;

ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "is_highlighted" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "highlight_priority" integer DEFAULT 0 NOT NULL;

DROP TABLE IF EXISTS "media";
