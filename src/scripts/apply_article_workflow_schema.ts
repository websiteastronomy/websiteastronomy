import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { Pool, neonConfig } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "article";
}

async function ensureEnum(name: string, values: string[]) {
  const existing = await db.execute(sql`
    select exists (
      select 1
      from pg_type
      where typname = ${name}
    ) as "exists"
  `);

  if ((existing.rows[0] as { exists?: boolean } | undefined)?.exists) {
    return;
  }

  const escaped = values
    .map((value) => `'${value.replace(/'/g, "''")}'`)
    .join(", ");
  await db.execute(sql.raw(`CREATE TYPE "${name}" AS ENUM(${escaped})`));
}

async function ensureArticleColumns() {
  const statements = [
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "slug" text`,
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "author_id" text`,
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "content_type" article_type DEFAULT 'article' NOT NULL`,
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "knowledge_category" article_knowledge_category DEFAULT 'Theory' NOT NULL`,
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "status" article_status DEFAULT 'draft' NOT NULL`,
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "core_approved" boolean DEFAULT false NOT NULL`,
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "is_deleted" boolean DEFAULT false NOT NULL`,
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "cover_image_url" text`,
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "meta_title" text`,
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "meta_description" text`,
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "published_at" timestamp`,
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp`,
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "rejection_reason" text`,
    `ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "version_number" integer DEFAULT 1 NOT NULL`,
  ];

  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
}

async function ensureArticleTables() {
  await db.execute(
    sql.raw(`
      CREATE TABLE IF NOT EXISTS "article_versions" (
        "id" text PRIMARY KEY,
        "article_id" text NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
        "version_number" integer NOT NULL,
        "title_snapshot" text NOT NULL,
        "excerpt_snapshot" text NOT NULL,
        "content_snapshot" text NOT NULL,
        "cover_image_url_snapshot" text,
        "meta_title_snapshot" text,
        "meta_description_snapshot" text,
        "edited_by" text REFERENCES "user"("id") ON DELETE SET NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `)
  );

  await db.execute(
    sql.raw(`
      CREATE TABLE IF NOT EXISTS "article_edit_requests" (
        "id" text PRIMARY KEY,
        "article_id" text NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
        "proposed_content" text NOT NULL,
        "proposed_by" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "status" article_edit_request_status DEFAULT 'pending' NOT NULL,
        "core_status" article_edit_request_status DEFAULT 'pending' NOT NULL,
        "admin_status" article_edit_request_status DEFAULT 'pending' NOT NULL,
        "reviewed_by" text REFERENCES "user"("id") ON DELETE SET NULL,
        "admin_reviewed_by" text REFERENCES "user"("id") ON DELETE SET NULL,
        "review_comment" text,
        "admin_comment" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `)
  );

  await db.execute(
    sql.raw(`
      CREATE TABLE IF NOT EXISTS "article_approval_logs" (
        "id" text PRIMARY KEY,
        "article_id" text NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
        "action" text NOT NULL,
        "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
        "comment" text,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `)
  );

  await db.execute(
    sql.raw(`
      CREATE TABLE IF NOT EXISTS "article_edit_locks" (
        "id" text PRIMARY KEY,
        "article_id" text NOT NULL REFERENCES "articles"("id") ON DELETE CASCADE,
        "locked_by" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "expires_at" timestamp NOT NULL,
        "released_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `)
  );
}

async function backfillArticles() {
  const result = await db.execute(sql.raw(`
    SELECT "id", "title", "category", "date", "coverImage", "isPublished"
    FROM "articles"
    ORDER BY "createdAt" ASC
  `));

  const usedSlugs = new Set<string>();

  for (const row of result.rows as Array<Record<string, any>>) {
    let slug = slugify(String(row.title || ""));
    let counter = 1;
    while (usedSlugs.has(slug)) {
      counter += 1;
      slug = `${slugify(String(row.title || ""))}-${counter}`;
    }
    usedSlugs.add(slug);

    const isPublished = Boolean(row.isPublished);
    const publishedAt = isPublished
      ? (row.date ? new Date(String(row.date)) : new Date())
      : null;

    await db.execute(sql`
      UPDATE "articles"
      SET
        "slug" = ${slug},
        "content_type" = CASE
          WHEN "category" IN ('article', 'guide', 'fact') THEN "category"::article_type
          ELSE 'article'::article_type
        END,
        "knowledge_category" = CASE
          WHEN "category" IN ('Physics', 'Mission', 'Theory', 'History', 'Hardware') THEN "category"::article_knowledge_category
          ELSE 'Theory'::article_knowledge_category
        END,
        "status" = CASE
          WHEN "isPublished" = true THEN 'published'::article_status
          ELSE 'draft'::article_status
        END,
        "core_approved" = CASE
          WHEN "isPublished" = true THEN true
          ELSE false
        END,
        "is_deleted" = false,
        "cover_image_url" = COALESCE("cover_image_url", "coverImage"),
        "published_at" = COALESCE("published_at", ${publishedAt}),
        "version_number" = COALESCE("version_number", 1)
      WHERE "id" = ${String(row.id)}
    `);
  }
}

async function ensureSlugUniqueConstraint() {
  await db.execute(
    sql.raw(`
      CREATE UNIQUE INDEX IF NOT EXISTS "articles_slug_unique"
      ON "articles" ("slug")
      WHERE "slug" IS NOT NULL
    `)
  );
}

async function verify() {
  const result = await db.execute(sql.raw(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('articles', 'article_versions', 'article_edit_requests', 'article_approval_logs')
    ORDER BY table_name
  `));

  console.log("verified_tables", JSON.stringify(result.rows));
}

async function main() {
  await ensureEnum("article_status", ["draft", "under_review", "published", "rejected"]);
  await ensureEnum("article_type", ["article", "guide", "fact"]);
  await ensureEnum("article_knowledge_category", ["Physics", "Mission", "Theory", "History", "Hardware"]);
  await ensureEnum("article_edit_request_status", ["pending", "approved", "rejected"]);

  await ensureArticleColumns();
  await ensureArticleTables();
  await backfillArticles();
  await ensureSlugUniqueConstraint();
  await verify();

  console.log("article workflow schema applied successfully");
  await pool.end();
}

main().catch((error) => {
  console.error("article workflow schema failed", error);
  process.exit(1);
});
