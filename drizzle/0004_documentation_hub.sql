ALTER TABLE "project_files" ALTER COLUMN "project_id" DROP NOT NULL;
ALTER TABLE "project_files" ADD COLUMN "file_id" text;
ALTER TABLE "project_files" ADD COLUMN "content" jsonb;
ALTER TABLE "project_files" ADD COLUMN "is_global" boolean DEFAULT false NOT NULL;
ALTER TABLE "project_files" ADD CONSTRAINT "project_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;

CREATE TABLE "form_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"user_id" text,
	"responses" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_form_id_project_files_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."project_files"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
