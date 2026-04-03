ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "quiz_type" text DEFAULT 'custom' NOT NULL;
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "start_date" timestamp;
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "end_date" timestamp;
ALTER TABLE "quizzes" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;

ALTER TABLE "quiz_attempts" ADD COLUMN IF NOT EXISTS "quiz_type" text DEFAULT 'custom' NOT NULL;
ALTER TABLE "quiz_attempts" ADD COLUMN IF NOT EXISTS "answers" jsonb DEFAULT '[]'::jsonb NOT NULL;
