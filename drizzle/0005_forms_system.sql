ALTER TABLE "form_responses" ADD COLUMN IF NOT EXISTS "is_external" boolean DEFAULT false NOT NULL;
ALTER TABLE "form_responses" ADD COLUMN IF NOT EXISTS "external_details" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "form_responses" ADD COLUMN IF NOT EXISTS "answers" jsonb DEFAULT '{}'::jsonb NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'form_responses'
      AND column_name = 'responses'
  ) THEN
    UPDATE "form_responses"
    SET "answers" = COALESCE("answers", "responses", '{}'::jsonb)
    WHERE "answers" = '{}'::jsonb;
  END IF;
END $$;

ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'form';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "reference_id" text;
