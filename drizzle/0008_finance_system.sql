DO $$ BEGIN
  CREATE TYPE "payment_type" AS ENUM ('event', 'form', 'membership', 'project');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "payment_status_v2" AS ENUM ('pending', 'success', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "expense_status" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text,
  "email" text NOT NULL,
  "amount" integer NOT NULL,
  "currency" text DEFAULT 'INR' NOT NULL,
  "razorpay_order_id" text NOT NULL,
  "razorpay_payment_id" text,
  "status" "payment_status_v2" DEFAULT 'pending' NOT NULL,
  "type" "payment_type" NOT NULL,
  "reference_id" text,
  "payment_method" text,
  "details" jsonb DEFAULT '{}' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payments_razorpay_order_id_unique" ON "payments" USING btree ("razorpay_order_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payments_razorpay_payment_id_unique" ON "payments" USING btree ("razorpay_payment_id");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "expenses" (
  "id" text PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "amount" integer NOT NULL,
  "category" text NOT NULL,
  "project_id" text,
  "paid_to" text NOT NULL,
  "receipt_url" text NOT NULL,
  "status" "expense_status" DEFAULT 'pending' NOT NULL,
  "created_by" text NOT NULL,
  "approved_by" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
