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
import { and, desc, eq, gt, isNull, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import {
  ArticleStatus,
  ArticleType,
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
  await createNotificationsForUsers(
    coreUserIds.map((userId) => ({
      userId,
      type: "system",
      title: "Article Submitted For Review",
      message: `${authorName} submitted "${article.title}" to the knowledge base review queue.`,
      link: "/admin",
    }))
  );
}

async function notifyArticleCoreApproved(article: any) {
  const adminUserIds = await getAdminUserIds();
  await createNotificationsForUsers(
    adminUserIds.map((userId) => ({
      userId,
      type: "system",
      title: "Article Ready To Publish",
      message: `"${article.title}" passed core review and is ready for admin publishing.`,
      link: "/admin",
    }))
  );
}

async function notifyArticlePublished(article: any) {
  if (!article.authorId) {
    return;
  }

  await createNotificationForUser({
    userId: article.authorId,
    type: "system",
    title: "Article Published",
    message: `Your article "${article.title}" is now live in the Education Hub.`,
    link: `/education/${article.slug || article.id}`,
  });
}

async function notifyEditRequestSubmitted(article: any) {
  const coreUserIds = await getCoreUserIds();
  await createNotificationsForUsers(
    coreUserIds.map((userId) => ({
      userId,
      type: "system",
      title: "Article Edit Request Submitted",
      message: `A member proposed changes to "${article.title}".`,
      link: `/education/${article.slug || article.id}`,
    }))
  );
}

async function notifyEditRequestReadyForAdmin(article: any) {
  const adminUserIds = await getAdminUserIds();
  await createNotificationsForUsers(
    adminUserIds.map((userId) => ({
      userId,
      type: "system",
      title: "Edit Request Needs Admin Approval",
      message: `Core approved proposed changes for "${article.title}".`,
      link: "/admin",
    }))
  );
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

export async function getPublishedArticlesAction() {
  const rows = await db
    .select()
    .from(articles)
    .where(and(eq(articles.isDeleted, false), eq(articles.status, "published")))
    .orderBy(desc(articles.publishedAt), desc(articles.updatedAt));

  return rows.map(serializeArticle);
}

export async function getArticleDetailAction(slugOrId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const viewerId = session?.user?.id || null;
  const viewerAccess = viewerId ? await getArticleAccess(viewerId) : null;
  const rows = await db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.isDeleted, false),
        or(eq(articles.id, slugOrId), eq(articles.slug, slugOrId))
      )
    )
    .limit(1);

  const article = rows[0];
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

  const versions =
    viewerAccess?.isAdmin || viewerAccess?.canReview
      ? await db
          .select()
          .from(article_versions)
          .where(eq(article_versions.articleId, article.id))
          .orderBy(desc(article_versions.versionNumber))
      : [];
  const approvalLogs =
    viewerAccess?.isAdmin || viewerAccess?.canReview
      ? await db
          .select()
          .from(article_approval_logs)
          .where(eq(article_approval_logs.articleId, article.id))
          .orderBy(desc(article_approval_logs.createdAt))
      : [];
  const locks =
    viewerAccess?.isAdmin || viewerAccess?.canReview
      ? await db
          .select()
          .from(article_edit_locks)
          .where(
            and(
              eq(article_edit_locks.articleId, article.id),
              isNull(article_edit_locks.releasedAt),
              gt(article_edit_locks.expiresAt, new Date())
            )
          )
          .orderBy(desc(article_edit_locks.updatedAt))
      : [];

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

  const articleRows = await db
    .select()
    .from(articles)
    .where(eq(articles.isDeleted, false))
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
    category: existing?.category || input.contentType || "article",
    contentType: input.contentType || existing?.contentType || "article",
    knowledgeCategory:
      (input.knowledgeCategory as any) ||
      existing?.knowledgeCategory ||
      "Theory",
    tags,
    status,
    coreApproved: mode === "publish" ? true : mode === "review" ? false : existing?.coreApproved || false,
    isPublished: mode === "publish",
    isFeatured: existing?.isFeatured || false,
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

export async function setArticleFeaturedAction(articleId: string, isFeatured: boolean) {
  const user = await getCurrentSessionUser();
  const access = await getArticleAccess(user.id);
  if (!access.isAdmin) {
    throw new Error("Forbidden");
  }

  const article = await fetchArticleOrThrow(articleId);
  await db
    .update(articles)
    .set({ isFeatured, updatedAt: new Date() })
    .where(eq(articles.id, articleId));
  revalidateArticlePaths({ ...article, isFeatured });
  return { success: true };
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
