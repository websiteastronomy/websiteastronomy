export const ARTICLE_TYPES = ["article", "guide", "fact"] as const;
export const ARTICLE_KNOWLEDGE_CATEGORIES = [
  "Physics",
  "Mission",
  "Theory",
  "History",
  "Hardware",
] as const;
export const ARTICLE_STATUSES = [
  "draft",
  "under_review",
  "published",
  "rejected",
] as const;

export type ArticleType = (typeof ARTICLE_TYPES)[number];
export type ArticleKnowledgeCategory =
  (typeof ARTICLE_KNOWLEDGE_CATEGORIES)[number];
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

const LEGACY_CONTENT_TYPES = new Set<ArticleType>(["article", "guide", "fact"]);

export function slugifyArticleTitle(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseArticleTags(raw: string | string[] | null | undefined) {
  if (Array.isArray(raw)) {
    return raw
      .map((tag) => String(tag).trim())
      .filter(Boolean);
  }

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function deriveExcerpt(content: string) {
  const plain = content.replace(/[#*_>`~[\]()!-]/g, " ").replace(/\s+/g, " ").trim();
  return plain.slice(0, 180);
}

export function normalizeArticleRecord(article: any) {
  const contentType: ArticleType = LEGACY_CONTENT_TYPES.has(article.contentType)
    ? article.contentType
    : LEGACY_CONTENT_TYPES.has(article.category)
      ? article.category
      : "article";
  const status: ArticleStatus = ARTICLE_STATUSES.includes(article.status)
    ? article.status
    : article.isPublished
      ? "published"
      : "draft";

  return {
    ...article,
    slug: article.slug || article.id,
    authorName: article.author || "Astronomy Club",
    coverImageUrl: article.coverImageUrl || article.coverImage || "",
    contentType,
    knowledgeCategory: ARTICLE_KNOWLEDGE_CATEGORIES.includes(article.knowledgeCategory)
      ? article.knowledgeCategory
      : "Theory",
    status,
    excerpt: article.excerpt || deriveExcerpt(article.content || ""),
    tags: Array.isArray(article.tags) ? article.tags : [],
    coreApproved: Boolean(article.coreApproved),
    isDeleted: Boolean(article.isDeleted),
    isFeatured: Boolean(article.isFeatured),
    isPublished: status === "published",
    versionNumber: Number(article.versionNumber || 1),
  };
}

export function canReviewArticles(access: {
  isAdmin: boolean;
  hasPermission: (key: string) => boolean;
}) {
  return access.isAdmin || access.hasPermission("approve_actions");
}

export function canPublishArticles(access: {
  isAdmin: boolean;
  hasPermission: (key: string) => boolean;
}) {
  return access.isAdmin;
}
