"use server";

import { db } from "@/db";
import {
  article_approval_logs,
  article_edit_locks,
  article_edit_requests,
  article_versions,
  articles,
  users,
} from "@/db/schema";
import { and, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import {
  ArticleStatus,
  ArticleType,
  normalizeArticleType,
  normalizeKnowledgeCategory,
  normalizeArticleRecord,
  parseArticleTags,
  slugifyArticleTitle,
} from "@/lib/article-workflow";
import { getUserProfile, hasPermission } from "@/lib/permissions";
import {
  createNotificationForUser,
  createNotificationsForUsers,
} from "@/app/actions/notifications";

const ARTICLE_LOCK_MINUTES = 15;
let articleWorkflowSchemaReadyPromise: Promise<boolean> | null = null;

type ArticleInput = {
  id?: string;
  title: string;
  content: string;
  excerpt?: string;
  coverImageUrl?: string;
  contentType?: ArticleType;
  knowledgeCategory?: string;
  tags?: string[] | string;
  metaTitle?: string;
  metaDescription?: string;
};

async function getCurrentSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

async function getArticleAccess(userId: string) {
  const profile = await getUserProfile(userId);
  const isAdmin =
    profile?.normalizedRole === "Admin" ||
    (await hasPermission(userId, "assign_roles")) ||
    (await hasPermission(userId, "delete_files"));
  const canReview = isAdmin || (await hasPermission(userId, "approve_actions"));

  return {
    isAdmin,
    canReview,
    roleName: profile?.normalizedRole || "none",
  };
}

async function getCoreUserIds() {
  const allUsers = await db.select({ id: users.id }).from(users);
  const flags = await Promise.all(
    allUsers.map(async (user) => {
      const access = await getArticleAccess(user.id);
      return {
        id: user.id,
        isCoreOnly: access.canReview && !access.isAdmin,
      };
    })
  );

  return flags.filter((entry) => entry.isCoreOnly).map((entry) => entry.id);
}

async function runNotificationSafely(label: string, task: () => Promise<void>) {
  try {
    await task();
  } catch (error) {
    console.error(`[articles] notification failure: ${label}`, error);
  }
}

async function getAdminUserIds() {
  const allUsers = await db.select({ id: users.id }).from(users);
  const flags = await Promise.all(
    allUsers.map(async (user) => ({
      id: user.id,
      isAdmin: (await getArticleAccess(user.id)).isAdmin,
    }))
  );

  return flags.filter((entry) => entry.isAdmin).map((entry) => entry.id);
}

async function buildUniqueSlug(title: string, currentArticleId?: string) {
  const base = slugifyArticleTitle(title) || "article";
  let slug = base;
  let counter = 1;

  while (true) {
    const matches = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);
    if (!matches.length || matches[0].id === currentArticleId) {
      return slug;
    }
    counter += 1;
    slug = `${base}-${counter}`;
  }
}

function toIsoDateString(value?: Date | string | null) {
  if (!value) {
    return new Date().toISOString();
  }

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function buildArticleExcerpt(input: ArticleInput) {
  const excerpt = (input.excerpt || "").trim();
  if (excerpt) {
    return excerpt;
  }

  return input.content.replace(/[#*_>`~[\]()!-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
}

async function recordApprovalLog(articleId: string, userId: string | null, action: string, comment?: string | null) {
  await db.insert(article_approval_logs).values({
    id: uuidv4(),
    articleId,
    action,
    userId,
    comment: comment || null,
  });
}

async function snapshotArticleVersion(article: any, editedBy: string | null) {
  await db.insert(article_versions).values({
    id: uuidv4(),
    articleId: article.id,
    versionNumber: Number(article.versionNumber || 1),
    titleSnapshot: article.title,
    excerptSnapshot: article.excerpt || "",
    contentSnapshot: article.content,
    coverImageUrlSnapshot: article.coverImageUrl || article.coverImage || null,
    metaTitleSnapshot: article.metaTitle || null,
    metaDescriptionSnapshot: article.metaDescription || null,
    editedBy,
  });
}

async function notifyArticleSubmitted(article: any, authorName: string) {
  const coreUserIds = await getCoreUserIds();
  await runNotificationSafely("article_submitted", async () => {
    await createNotificationsForUsers(
      coreUserIds.map((userId) => ({
        userId,
        type: "system",
        title: "Article Submitted For Review",
        message: `${authorName} submitted "${article.title}" to the knowledge base review queue.`,
        link: "/admin",
      }))
    );
  });
}

async function notifyArticleCoreApproved(article: any) {
  const adminUserIds = await getAdminUserIds();
  await runNotificationSafely("article_core_approved", async () => {
    await createNotificationsForUsers(
      adminUserIds.map((userId) => ({
        userId,
        type: "system",
        title: "Article Ready To Publish",
        message: `"${article.title}" passed core review and is ready for admin publishing.`,
        link: "/admin",
      }))
    );
  });
}

async function notifyArticlePublished(article: any) {
  if (!article.authorId) {
    return;
  }

  await runNotificationSafely("article_published", async () => {
    await createNotificationForUser({
      userId: article.authorId,
      type: "system",
      title: "Article Published",
      message: `Your article "${article.title}" is now live in the Education Hub.`,
      link: `/education/${article.slug || article.id}`,
    });
  });
}

async function notifyEditRequestSubmitted(article: any) {
  const coreUserIds = await getCoreUserIds();
  await runNotificationSafely("article_edit_request_submitted", async () => {
    await createNotificationsForUsers(
      coreUserIds.map((userId) => ({
        userId,
        type: "system",
        title: "Article Edit Request Submitted",
        message: `A member proposed changes to "${article.title}".`,
        link: `/education/${article.slug || article.id}`,
      }))
    );
  });
}

async function notifyEditRequestReadyForAdmin(article: any) {
  const adminUserIds = await getAdminUserIds();
  await runNotificationSafely("article_edit_request_ready_for_admin", async () => {
    await createNotificationsForUsers(
      adminUserIds.map((userId) => ({
        userId,
        type: "system",
        title: "Edit Request Needs Admin Approval",
        message: `Core approved proposed changes for "${article.title}".`,
        link: "/admin",
      }))
    );
  });
}

function revalidateArticlePaths(article: any) {
  revalidatePath("/admin");
  revalidatePath("/education");
  revalidatePath(`/education/${article.slug || article.id}`);
}

async function assertArticleLockAvailable(articleId: string, userId: string) {
  const now = new Date();
  const locks = await db
    .select()
    .from(article_edit_locks)
    .where(
      and(
        eq(article_edit_locks.articleId, articleId),
        isNull(article_edit_locks.releasedAt),
        gt(article_edit_locks.expiresAt, now)
      )
    )
    .orderBy(desc(article_edit_locks.updatedAt));

  const activeLock = locks[0];
  if (activeLock && activeLock.lockedBy !== userId) {
    throw new Error("This article is currently locked by another editor.");
  }
}

async function fetchArticleOrThrow(articleId: string) {
  const rows = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
  if (!rows.length) {
    throw new Error("Article not found");
  }
  return rows[0];
}

function serializeArticle(article: any) {
  const normalized = normalizeArticleRecord(article);
  return {
    ...normalized,
    createdAt: article.createdAt?.toISOString?.() || null,
    updatedAt: article.updatedAt?.toISOString?.() || null,
    publishedAt: article.publishedAt?.toISOString?.() || null,
    submittedAt: article.submittedAt?.toISOString?.() || null,
  };
}

function isMissingArticleWorkflowColumnError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes(`column "slug"`) ||
    message.includes(`column "author_id"`) ||
    message.includes(`column "content_type"`) ||
    message.includes(`column "knowledge_category"`) ||
    message.includes(`column "status"`) ||
    message.includes(`column "core_approved"`) ||
    message.includes(`column "is_deleted"`) ||
    message.includes(`column "cover_image_url"`) ||
    message.includes(`column "meta_title"`) ||
    message.includes(`column "meta_description"`) ||
    message.includes(`column "published_at"`) ||
    message.includes(`column "submitted_at"`) ||
    message.includes(`column "rejection_reason"`) ||
    message.includes(`column "version_number"`) ||
    message.includes(`column "is_highlighted"`) ||
    message.includes(`column "highlight_priority"`)
  );
}

async function detectArticleWorkflowSchemaReady() {
  const result = await db.execute(sql`
    select
      exists (
        select 1
        from information_schema.columns
        where table_name = 'articles'
          and column_name = 'slug'
      ) as "hasSlug",
      exists (
        select 1
        from information_schema.columns
        where table_name = 'articles'
          and column_name = 'status'
      ) as "hasStatus",
      exists (
        select 1
        from information_schema.columns
        where table_name = 'articles'
          and column_name = 'is_deleted'
      ) as "hasIsDeleted",
      exists (
        select 1
        from information_schema.tables
        where table_name = 'article_edit_requests'
      ) as "hasEditRequests",
      exists (
        select 1
        from information_schema.tables
        where table_name = 'article_versions'
      ) as "hasVersions"
  `);

  const row = result.rows[0] as
    | {
        hasSlug?: boolean;
        hasStatus?: boolean;
        hasIsDeleted?: boolean;
        hasEditRequests?: boolean;
        hasVersions?: boolean;
      }
    | undefined;

  return Boolean(
    row?.hasSlug &&
      row?.hasStatus &&
      row?.hasIsDeleted &&
      row?.hasEditRequests &&
      row?.hasVersions
  );
}

async function isArticleWorkflowSchemaReady() {
  if (!articleWorkflowSchemaReadyPromise) {
    articleWorkflowSchemaReadyPromise = detectArticleWorkflowSchemaReady().catch(
      () => false
    );
  }

  return articleWorkflowSchemaReadyPromise;
}

async function getPublishedArticlesLegacyFallback() {
  const result = await db.execute(sql`
    select
      "id",
      "category",
      "title",
      "author",
      "date",
      "excerpt",
      "content",
      "coverImage",
      "isPublished",
      "isFeatured",
      "tags",
      "createdAt",
      "updatedAt"
    from "articles"
    where "isPublished" = true
    order by "updatedAt" desc
  `);

  return result.rows.map((row: any) => serializeArticle(row));
}

async function getArticleDetailLegacyFallback(slugOrId: string) {
  const result = await db.execute(sql`
    select
      "id",
      "category",
      "title",
      "author",
      "date",
      "excerpt",
      "content",
      "coverImage",
      "isPublished",
      "isFeatured",
      "tags",
      "createdAt",
      "updatedAt"
    from "articles"
    where "id" = ${slugOrId}
    limit 1
  `);

  const row = result.rows[0] as any;
  if (!row) {
    return null;
  }

  const normalized = serializeArticle(row);
  if (normalized.status !== "published") {
    return null;
  }

  return {
    article: normalized,
    versions: [],
    approvalLogs: [],
    activeLock: null,
  };
}

async function getArticleManagementSnapshotLegacyFallback() {
  const result = await db.execute(sql`
    select
      "id",
      "category",
      "title",
      "author",
      "date",
      "excerpt",
      "content",
      "coverImage",
      "isPublished",
      "isFeatured",
      "tags",
      "createdAt",
      "updatedAt"
    from "articles"
    order by "updatedAt" desc
  `);

  return {
    articles: result.rows.map((row: any) => serializeArticle(row)),
    editRequests: [],
  };
}

export async function getPublishedArticlesAction() {
  if (!(await isArticleWorkflowSchemaReady())) {
    return await getPublishedArticlesLegacyFallback();
  }

  try {
    const rows = await db
      .select()
      .from(articles)
      .where(
        and(
          or(eq(articles.isDeleted, false), isNull(articles.isDeleted)),
          or(eq(articles.status, "published"), eq(articles.isPublished, true))
        )
      )
      .orderBy(desc(articles.publishedAt), desc(articles.updatedAt));

    return rows.map(serializeArticle);
  } catch (error) {
    if (!isMissingArticleWorkflowColumnError(error)) {
      throw error;
    }

    console.warn("[articles] Falling back to legacy published article query because workflow columns are not migrated yet.");
    return await getPublishedArticlesLegacyFallback();
  }
}

export async function getArticleDetailAction(slugOrId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const viewerId = session?.user?.id || null;
  const viewerAccess = viewerId ? await getArticleAccess(viewerId) : null;
  if (!(await isArticleWorkflowSchemaReady())) {
    return await getArticleDetailLegacyFallback(slugOrId);
  }

  let article: any = null;
  let versions: any[] = [];
  let approvalLogs: any[] = [];
  let locks: any[] = [];

  try {
    const rows = await db
      .select()
      .from(articles)
      .where(
        and(
          or(eq(articles.isDeleted, false), isNull(articles.isDeleted)),
          or(eq(articles.id, slugOrId), eq(articles.slug, slugOrId))
        )
      )
      .limit(1);

    article = rows[0];
    if (article && (viewerAccess?.isAdmin || viewerAccess?.canReview)) {
      versions = await db
        .select()
        .from(article_versions)
        .where(eq(article_versions.articleId, article.id))
        .orderBy(desc(article_versions.versionNumber));
      approvalLogs = await db
        .select()
        .from(article_approval_logs)
        .where(eq(article_approval_logs.articleId, article.id))
        .orderBy(desc(article_approval_logs.createdAt));
      locks = await db
        .select()
        .from(article_edit_locks)
        .where(
          and(
            eq(article_edit_locks.articleId, article.id),
            isNull(article_edit_locks.releasedAt),
            gt(article_edit_locks.expiresAt, new Date())
          )
        )
        .orderBy(desc(article_edit_locks.updatedAt));
    }
  } catch (error) {
    if (!isMissingArticleWorkflowColumnError(error)) {
      throw error;
    }

    console.warn("[articles] Falling back to legacy article detail query because workflow columns are not migrated yet.");
    return await getArticleDetailLegacyFallback(slugOrId);
  }

  if (!article) {
    return null;
  }

  const canViewUnpublished =
    !!viewerId &&
    (viewerAccess?.isAdmin ||
      viewerAccess?.canReview ||
      article.authorId === viewerId);

  const normalized = normalizeArticleRecord(article);
  if (!canViewUnpublished && normalized.status !== "published") {
    return null;
  }

  return {
    article: serializeArticle(article),
    versions: versions.map((version) => ({
      ...version,
      createdAt: version.createdAt?.toISOString?.() || null,
    })),
    approvalLogs: approvalLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt?.toISOString?.() || null,
    })),
    activeLock: locks[0]
      ? {
          ...locks[0],
          expiresAt: locks[0].expiresAt?.toISOString?.() || null,
          createdAt: locks[0].createdAt?.toISOString?.() || null,
          updatedAt: locks[0].updatedAt?.toISOString?.() || null,
        }
      : null,
  };
}

export async function getArticleManagementSnapshotAction() {
  const user = await getCurrentSessionUser();
  const access = await getArticleAccess(user.id);
  if (!access.canReview && !access.isAdmin) {
    throw new Error("Forbidden");
  }

  if (!(await isArticleWorkflowSchemaReady())) {
    const legacy = await getArticleManagementSnapshotLegacyFallback();
    return {
      access,
      articles: legacy.articles,
      editRequests: legacy.editRequests,
    };
  }

  try {
    const articleRows = await db
      .select()
      .from(articles)
      .where(or(eq(articles.isDeleted, false), isNull(articles.isDeleted)))
      .orderBy(desc(articles.updatedAt));
    const editRequestRows = await db
      .select()
      .from(article_edit_requests)
      .orderBy(desc(article_edit_requests.updatedAt));

    return {
      access,
      articles: articleRows.map(serializeArticle),
      editRequests: editRequestRows.map((request) => ({
        ...request,
        createdAt: request.createdAt?.toISOString?.() || null,
        updatedAt: request.updatedAt?.toISOString?.() || null,
      })),
    };
  } catch (error) {
    if (!isMissingArticleWorkflowColumnError(error)) {
      throw error;
    }

    console.warn("[articles] Falling back to legacy article management query because workflow columns are not migrated yet.");
    const legacy = await getArticleManagementSnapshotLegacyFallback();
    return {
      access,
      articles: legacy.articles,
      editRequests: legacy.editRequests,
    };
  }
}

export async function saveArticleAction(input: ArticleInput, mode: "draft" | "review" | "publish") {
  const user = await getCurrentSessionUser();
  const access = await getArticleAccess(user.id);
  const articleId = input.id || uuidv4();
  const existing = input.id ? await fetchArticleOrThrow(input.id) : null;

  if (existing) {
    const isOwner = existing.authorId === user.id;
    if (!isOwner && !access.canReview && !access.isAdmin) {
      throw new Error("Forbidden");
    }
    if (normalizeArticleRecord(existing).status === "published" && !access.canReview && !access.isAdmin) {
      throw new Error("Published articles must be changed through an edit request.");
    }
    await assertArticleLockAvailable(existing.id, user.id);
  }

  if (mode === "publish" && !access.isAdmin) {
    throw new Error("Only admins can publish articles directly.");
  }

  const excerpt = buildArticleExcerpt(input);
  const slug = await buildUniqueSlug(input.title, existing?.id);
  const tags = parseArticleTags(input.tags);
  const now = new Date();
  const contentType = normalizeArticleType(input.contentType || existing?.contentType || existing?.category);
  const knowledgeCategory = normalizeKnowledgeCategory(
    (input.knowledgeCategory as string | undefined) || existing?.knowledgeCategory || existing?.category
  );
  const status: ArticleStatus =
    mode === "publish" ? "published" : mode === "review" ? "under_review" : "draft";

  if (existing) {
    await snapshotArticleVersion(existing, user.id);
  }

  const payload = {
    title: input.title,
    slug,
    content: input.content,
    excerpt,
    author: existing?.author || user.name || "Astronomy Club",
    authorId: existing?.authorId || user.id,
    category: contentType,
    contentType,
    knowledgeCategory,
    tags,
    status,
    coreApproved: mode === "publish" ? true : mode === "review" ? false : existing?.coreApproved || false,
    isPublished: mode === "publish",
    isFeatured: existing?.isFeatured || false,
    isHighlighted: existing?.isHighlighted || false,
    highlightPriority: Number(existing?.highlightPriority || 0),
    isDeleted: false,
    coverImage: input.coverImageUrl || existing?.coverImage || "",
    coverImageUrl: input.coverImageUrl || existing?.coverImageUrl || existing?.coverImage || null,
    metaTitle: input.metaTitle || null,
    metaDescription: input.metaDescription || null,
    date: toIsoDateString(existing?.publishedAt || existing?.date || null),
    publishedAt: mode === "publish" ? now : existing?.publishedAt || null,
    submittedAt: mode === "review" ? now : existing?.submittedAt || null,
    rejectionReason: mode === "review" ? null : existing?.rejectionReason || null,
    versionNumber: existing ? Number(existing.versionNumber || 1) + 1 : 1,
    updatedAt: now,
  };

  if (existing) {
    await db.update(articles).set(payload).where(eq(articles.id, existing.id));
  } else {
    await db.insert(articles).values({
      id: articleId,
      createdAt: now,
      ...payload,
    });
  }

  const savedArticle = normalizeArticleRecord({
    ...(existing || {}),
    id: existing?.id || articleId,
    createdAt: existing?.createdAt || now,
    ...payload,
  });

  if (mode === "review") {
    await recordApprovalLog(savedArticle.id, user.id, "submitted", null);
    await notifyArticleSubmitted(savedArticle, user.name || "A member");
  }
  if (mode === "publish") {
    await recordApprovalLog(savedArticle.id, user.id, "published_by_admin", null);
    await notifyArticlePublished(savedArticle);
  }

  revalidateArticlePaths(savedArticle);
  return { success: true, article: savedArticle };
}

export async function reviewArticleAction(articleId: string, decision: "approve" | "reject", comment?: string) {
  const user = await getCurrentSessionUser();
  const access = await getArticleAccess(user.id);
  if (!access.canReview) {
    throw new Error("Forbidden");
  }

  const article = await fetchArticleOrThrow(articleId);
  if (normalizeArticleRecord(article).status !== "under_review") {
    throw new Error("Only submitted articles can be reviewed.");
  }

  await db
    .update(articles)
    .set({
      coreApproved: decision === "approve",
      status: decision === "approve" ? "under_review" : "rejected",
      rejectionReason: decision === "reject" ? comment || "Rejected during review." : null,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, articleId));

  const updatedArticle = normalizeArticleRecord({
    ...article,
    coreApproved: decision === "approve",
    status: decision === "approve" ? "under_review" : "rejected",
    rejectionReason: decision === "reject" ? comment || "Rejected during review." : null,
  });

  await recordApprovalLog(
    articleId,
    user.id,
    decision === "approve" ? "approved_by_core" : "rejected_by_core",
    comment || null
  );

  if (decision === "approve") {
    await notifyArticleCoreApproved(updatedArticle);
  } else if (article.authorId) {
    await createNotificationForUser({
      userId: article.authorId,
      type: "system",
      title: "Article Rejected",
      message: comment
        ? `Your article "${article.title}" was rejected. ${comment}`
        : `Your article "${article.title}" was rejected during core review.`,
      link: `/education/${article.slug || article.id}`,
    });
  }

  revalidateArticlePaths(updatedArticle);
  return { success: true };
}

export async function publishArticleAction(articleId: string) {
  const user = await getCurrentSessionUser();
  const access = await getArticleAccess(user.id);
  if (!access.isAdmin) {
    throw new Error("Forbidden");
  }

  const article = await fetchArticleOrThrow(articleId);
  await db
    .update(articles)
    .set({
      status: "published",
      coreApproved: true,
      isPublished: true,
      publishedAt: new Date(),
      updatedAt: new Date(),
      rejectionReason: null,
    })
    .where(eq(articles.id, articleId));

  const updatedArticle = normalizeArticleRecord({
    ...article,
    status: "published",
    coreApproved: true,
    isPublished: true,
    publishedAt: new Date(),
    rejectionReason: null,
  });

  await recordApprovalLog(articleId, user.id, "published_by_admin", null);
  await notifyArticlePublished(updatedArticle);
  revalidateArticlePaths(updatedArticle);
  return { success: true };
}

export async function setArticleHighlightAction(articleId: string, isHighlighted: boolean, priority: number) {
  const user = await getCurrentSessionUser();
  const access = await getArticleAccess(user.id);
  if (!access.isAdmin && !access.canReview) {
    throw new Error("Forbidden");
  }
  if (!Number.isFinite(priority)) {
    throw new Error("Priority must be numeric.");
  }

  const article = await fetchArticleOrThrow(articleId);
  if (normalizeArticleRecord(article).status !== "published") {
    throw new Error("Only published articles can be highlighted.");
  }

  if (isHighlighted) {
    const currentHighlighted = await db
      .select({ id: articles.id })
      .from(articles)
      .where(
        and(
          eq(articles.isHighlighted, true),
          or(eq(articles.isDeleted, false), isNull(articles.isDeleted))
        )
      );
    const alreadyHighlighted = currentHighlighted.some((entry) => entry.id === articleId);
    if (!alreadyHighlighted && currentHighlighted.length >= 10) {
      throw new Error("Highlight limit reached. Keep at most 10 highlighted articles.");
    }
  }

  await db
    .update(articles)
    .set({
      isHighlighted,
      highlightPriority: Math.trunc(priority),
      updatedAt: new Date(),
    })
    .where(eq(articles.id, articleId));
  revalidateArticlePaths({
    ...article,
    isHighlighted,
    highlightPriority: Math.trunc(priority),
  });
  return { success: true };
}

// Backward-compatible alias for older callers.
export async function setArticleFeaturedAction(articleId: string, isFeatured: boolean) {
  return setArticleHighlightAction(articleId, isFeatured, isFeatured ? 1 : 0);
}

export async function softDeleteArticleAction(articleId: string) {
  const user = await getCurrentSessionUser();
  const access = await getArticleAccess(user.id);
  if (!access.isAdmin) {
    throw new Error("Forbidden");
  }

  const article = await fetchArticleOrThrow(articleId);
  await db
    .update(articles)
    .set({
      isDeleted: true,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, articleId));
  revalidateArticlePaths(article);
  return { success: true };
}

export async function submitArticleEditRequestAction(articleId: string, proposedContent: string) {
  const user = await getCurrentSessionUser();
  const article = await fetchArticleOrThrow(articleId);
  if (normalizeArticleRecord(article).status !== "published") {
    throw new Error("Edit requests can only be submitted for published articles.");
  }

  await db.insert(article_edit_requests).values({
    id: uuidv4(),
    articleId,
    proposedContent,
    proposedBy: user.id,
    status: "pending",
    coreStatus: "pending",
    adminStatus: "pending",
  });

  await recordApprovalLog(articleId, user.id, "edit_request_submitted", null);
  await notifyEditRequestSubmitted(normalizeArticleRecord(article));
  revalidateArticlePaths(article);
  return { success: true };
}

export async function reviewArticleEditRequestAction(
  requestId: string,
  decision: "approve" | "reject",
  comment?: string
) {
  const user = await getCurrentSessionUser();
  const access = await getArticleAccess(user.id);
  if (!access.canReview) {
    throw new Error("Forbidden");
  }

  const requests = await db
    .select()
    .from(article_edit_requests)
    .where(eq(article_edit_requests.id, requestId))
    .limit(1);
  const request = requests[0];
  if (!request) {
    throw new Error("Edit request not found");
  }

  const article = await fetchArticleOrThrow(request.articleId);

  if (decision === "approve") {
    await db
      .update(article_edit_requests)
      .set({
        coreStatus: "approved",
        adminStatus: "pending",
        status: "pending",
        reviewedBy: user.id,
        reviewComment: comment || null,
        updatedAt: new Date(),
      })
      .where(eq(article_edit_requests.id, requestId));
    await recordApprovalLog(article.id, user.id, "edit_request_approved_by_core", comment || null);
    await notifyEditRequestReadyForAdmin(normalizeArticleRecord(article));
  } else {
    await db
      .update(article_edit_requests)
      .set({
        coreStatus: "rejected",
        adminStatus: "rejected",
        status: "rejected",
        reviewedBy: user.id,
        reviewComment: comment || null,
        updatedAt: new Date(),
      })
      .where(eq(article_edit_requests.id, requestId));
    await recordApprovalLog(article.id, user.id, "edit_request_rejected_by_core", comment || null);

    await createNotificationForUser({
      userId: request.proposedBy,
      type: "system",
      title: "Edit Request Rejected",
      message: comment
        ? `Your proposed changes to "${article.title}" were rejected. ${comment}`
        : `Your proposed changes to "${article.title}" were rejected.`,
      link: `/education/${article.slug || article.id}`,
    });
  }

  revalidateArticlePaths(article);
  return { success: true };
}

export async function finalizeArticleEditRequestAction(
  requestId: string,
  decision: "approve" | "reject",
  comment?: string
) {
  const user = await getCurrentSessionUser();
  const access = await getArticleAccess(user.id);
  if (!access.isAdmin) {
    throw new Error("Forbidden");
  }

  const requests = await db
    .select()
    .from(article_edit_requests)
    .where(eq(article_edit_requests.id, requestId))
    .limit(1);
  const request = requests[0];
  if (!request) {
    throw new Error("Edit request not found");
  }

  const article = await fetchArticleOrThrow(request.articleId);

  if (decision === "reject") {
    await db
      .update(article_edit_requests)
      .set({
        adminStatus: "rejected",
        status: "rejected",
        adminReviewedBy: user.id,
        adminComment: comment || null,
        updatedAt: new Date(),
      })
      .where(eq(article_edit_requests.id, requestId));

    await recordApprovalLog(article.id, user.id, "edit_request_rejected_by_admin", comment || null);
    await createNotificationForUser({
      userId: request.proposedBy,
      type: "system",
      title: "Edit Request Rejected",
      message: comment
        ? `Your proposed changes to "${article.title}" were rejected by admin. ${comment}`
        : `Your proposed changes to "${article.title}" were rejected by admin.`,
      link: `/education/${article.slug || article.id}`,
    });
    revalidateArticlePaths(article);
    return { success: true };
  }

  await assertArticleLockAvailable(article.id, user.id);
  await snapshotArticleVersion(article, user.id);
  const updatedAt = new Date();
  await db
    .update(articles)
    .set({
      content: request.proposedContent,
      excerpt: buildArticleExcerpt({
        title: article.title,
        content: request.proposedContent,
        excerpt: article.excerpt,
      }),
      versionNumber: Number(article.versionNumber || 1) + 1,
      updatedAt,
    })
    .where(eq(articles.id, article.id));

  await db
    .update(article_edit_requests)
    .set({
      adminStatus: "approved",
      status: "approved",
      adminReviewedBy: user.id,
      adminComment: comment || null,
      updatedAt,
    })
    .where(eq(article_edit_requests.id, requestId));

  await recordApprovalLog(article.id, user.id, "edit_request_published", comment || null);
  await createNotificationForUser({
    userId: request.proposedBy,
    type: "system",
    title: "Edit Request Approved",
    message: `Your changes to "${article.title}" were approved and merged into the live article.`,
    link: `/education/${article.slug || article.id}`,
  });
  revalidateArticlePaths(article);
  return { success: true };
}

export async function rollbackArticleVersionAction(articleId: string, versionId: string) {
  const user = await getCurrentSessionUser();
  const access = await getArticleAccess(user.id);
  if (!access.canReview && !access.isAdmin) {
    throw new Error("Forbidden");
  }

  const article = await fetchArticleOrThrow(articleId);
  const versions = await db
    .select()
    .from(article_versions)
    .where(
      and(
        eq(article_versions.id, versionId),
        eq(article_versions.articleId, articleId)
      )
    )
    .limit(1);
  const version = versions[0];
  if (!version) {
    throw new Error("Version not found");
  }

  await assertArticleLockAvailable(article.id, user.id);
  await snapshotArticleVersion(article, user.id);
  await db
    .update(articles)
    .set({
      title: version.titleSnapshot,
      slug: await buildUniqueSlug(version.titleSnapshot, article.id),
      excerpt: version.excerptSnapshot,
      content: version.contentSnapshot,
      coverImage: version.coverImageUrlSnapshot || article.coverImage,
      coverImageUrl: version.coverImageUrlSnapshot || article.coverImageUrl,
      metaTitle: version.metaTitleSnapshot,
      metaDescription: version.metaDescriptionSnapshot,
      versionNumber: Number(article.versionNumber || 1) + 1,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, article.id));

  await recordApprovalLog(article.id, user.id, "rolled_back_version", `Rolled back to version ${version.versionNumber}`);
  revalidateArticlePaths(article);
  return { success: true };
}

export async function acquireArticleEditLockAction(articleId: string) {
  const user = await getCurrentSessionUser();
  const access = await getArticleAccess(user.id);
  if (!access.canReview && !access.isAdmin) {
    throw new Error("Forbidden");
  }

  await assertArticleLockAvailable(articleId, user.id);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ARTICLE_LOCK_MINUTES * 60 * 1000);
  const existing = await db
    .select()
    .from(article_edit_locks)
    .where(
      and(
        eq(article_edit_locks.articleId, articleId),
        eq(article_edit_locks.lockedBy, user.id),
        isNull(article_edit_locks.releasedAt)
      )
    )
    .orderBy(desc(article_edit_locks.updatedAt))
    .limit(1);

  if (existing.length) {
    await db
      .update(article_edit_locks)
      .set({ expiresAt, updatedAt: now })
      .where(eq(article_edit_locks.id, existing[0].id));
    return { success: true, lockId: existing[0].id, expiresAt: expiresAt.toISOString() };
  }

  const lockId = uuidv4();
  await db.insert(article_edit_locks).values({
    id: lockId,
    articleId,
    lockedBy: user.id,
    expiresAt,
    updatedAt: now,
  });
  return { success: true, lockId, expiresAt: expiresAt.toISOString() };
}

export async function releaseArticleEditLockAction(articleId: string) {
  const user = await getCurrentSessionUser();
  await db
    .update(article_edit_locks)
    .set({
      releasedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(article_edit_locks.articleId, articleId),
        eq(article_edit_locks.lockedBy, user.id),
        isNull(article_edit_locks.releasedAt)
      )
    );
  return { success: true };
}
