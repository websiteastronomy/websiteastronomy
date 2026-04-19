import { and, desc, eq, like } from "drizzle-orm";
import { db } from "@/db";
import { files, system_settings } from "@/db/schema";
import { getR2PublicUrl } from "@/lib/r2-storage";

export type StorageModule =
  | "docs"
  | "projects"
  | "forms"
  | "general"
  | "profile_images"
  | "outreach_images"
  | "achievement_images"
  | "observation_images"
  | "article_images"
  | "finance_receipts";

export type UploadCategory =
  | "projects"
  | "events"
  | "media"
  | "users"
  | "general"
  | "quizzes"
  | "documentation"
  | "forms"
  | "profile_images"
  | "outreach_images"
  | "achievement_images"
  | "observation_images"
  | "article_images"
  | "finance_receipts";

export type UploadIntent = {
  category: UploadCategory;
  fileName: string;
  fileType: string;
  fileSize: number;
  entityId?: string | null;
  projectId?: string | null;
  isGlobal?: boolean;
  isPublic?: boolean;
};

export type StorageRule = {
  maxFileSizeMb: number;
  allowedFileTypes: string[];
};

export type StorageRules = Record<StorageModule, StorageRule>;

type UploadPlan = {
  module: StorageModule;
  key: string;
  finalFileName: string;
  publicUrl: string;
  version: number;
  projectId: string | null;
  eventId: string | null;
  isPublic: boolean;
};

const STORAGE_RULE_KEYS: Record<StorageModule, string[]> = {
  docs: ["storage_rule_docs", "storage_rule_documents"],
  projects: ["storage_rule_projects"],
  forms: ["storage_rule_forms"],
  general: ["storage_rule_general", "max_file_size_mb"],
  profile_images: ["storage_rule_profile_images"],
  outreach_images: ["storage_rule_outreach_images"],
  achievement_images: ["storage_rule_achievement_images"],
  observation_images: ["storage_rule_observation_images"],
  article_images: ["storage_rule_article_images"],
  finance_receipts: ["storage_rule_finance_receipts"],
};

const DEFAULT_STORAGE_RULES: StorageRules = {
  docs: { maxFileSizeMb: 100, allowedFileTypes: ["*/*"] },
  projects: { maxFileSizeMb: 100, allowedFileTypes: ["*/*"] },
  forms: { maxFileSizeMb: 100, allowedFileTypes: ["*/*"] },
  general: { maxFileSizeMb: 25, allowedFileTypes: ["*/*"] },
  profile_images: { maxFileSizeMb: 5, allowedFileTypes: ["image/jpeg", "image/png", "image/webp"] },
  outreach_images: { maxFileSizeMb: 15, allowedFileTypes: ["image/jpeg", "image/png", "image/webp"] },
  achievement_images: { maxFileSizeMb: 15, allowedFileTypes: ["image/jpeg", "image/png", "image/webp"] },
  observation_images: { maxFileSizeMb: 20, allowedFileTypes: ["image/jpeg", "image/png", "image/webp"] },
  article_images: { maxFileSizeMb: 10, allowedFileTypes: ["image/jpeg", "image/png", "image/webp"] },
  finance_receipts: { maxFileSizeMb: 25, allowedFileTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"] },
};

export function normalizeAllowedTypes(values: string[] | undefined): string[] {
  const normalized = (values || [])
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .map((value) => {
      if (value === "*") return "*/*";
      if (!value.includes("/") && !value.startsWith(".")) return `.${value.replace(/^\.+/, "")}`;
      return value;
    });

  return normalized.length ? Array.from(new Set(normalized)) : ["*/*"];
}

function clampFileSizeMb(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.round(value), 1), 500);
}

function parseStoredRule(module: StorageModule, raw: string | null | undefined): StorageRule {
  const fallback = DEFAULT_STORAGE_RULES[module];
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<StorageRule>;
    return {
      maxFileSizeMb: clampFileSizeMb(Number(parsed.maxFileSizeMb), fallback.maxFileSizeMb),
      allowedFileTypes: normalizeAllowedTypes(parsed.allowedFileTypes),
    };
  } catch {
    const numeric = Number.parseInt(raw, 10);
    if (Number.isFinite(numeric)) {
      return {
        maxFileSizeMb: clampFileSizeMb(numeric, fallback.maxFileSizeMb),
        allowedFileTypes: fallback.allowedFileTypes,
      };
    }

    return fallback;
  }
}

export function serializeStorageRule(rule: StorageRule): string {
  return JSON.stringify({
    maxFileSizeMb: clampFileSizeMb(rule.maxFileSizeMb, 100),
    allowedFileTypes: normalizeAllowedTypes(rule.allowedFileTypes),
  });
}

export function formatAllowedTypes(rule: StorageRule): string {
  if (rule.allowedFileTypes.includes("*/*")) return "All file types";
  return rule.allowedFileTypes.join(", ");
}

export function inferStorageModule(category: UploadCategory): StorageModule {
  if (category === "documentation") return "docs";
  if (category === "projects") return "projects";
  if (category === "forms") return "forms";
  if (category === "profile_images") return "profile_images";
  if (category === "outreach_images") return "outreach_images";
  if (category === "achievement_images") return "achievement_images";
  if (category === "observation_images") return "observation_images";
  if (category === "article_images") return "article_images";
  if (category === "finance_receipts") return "finance_receipts";
  return "general";
}

export function getStorageRuleKey(module: StorageModule): string {
  return STORAGE_RULE_KEYS[module][0];
}

function getStoredRuleValue(byKey: Map<string, string>, module: StorageModule) {
  return STORAGE_RULE_KEYS[module].find((key) => byKey.has(key))
    ? byKey.get(STORAGE_RULE_KEYS[module].find((key) => byKey.has(key)) as string)
    : null;
}

export async function getStorageRules(): Promise<StorageRules> {
  const rows = await db.select().from(system_settings);
  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  return {
    docs: parseStoredRule("docs", getStoredRuleValue(byKey, "docs")),
    projects: parseStoredRule("projects", getStoredRuleValue(byKey, "projects")),
    forms: parseStoredRule("forms", getStoredRuleValue(byKey, "forms")),
    general: parseStoredRule("general", getStoredRuleValue(byKey, "general")),
    profile_images: parseStoredRule("profile_images", getStoredRuleValue(byKey, "profile_images")),
    outreach_images: parseStoredRule("outreach_images", getStoredRuleValue(byKey, "outreach_images")),
    achievement_images: parseStoredRule("achievement_images", getStoredRuleValue(byKey, "achievement_images")),
    observation_images: parseStoredRule("observation_images", getStoredRuleValue(byKey, "observation_images")),
    article_images: parseStoredRule("article_images", getStoredRuleValue(byKey, "article_images")),
    finance_receipts: parseStoredRule("finance_receipts", getStoredRuleValue(byKey, "finance_receipts")),
  };
}

export async function getStorageRule(module: StorageModule): Promise<StorageRule> {
  const rows = await db.select().from(system_settings).where(like(system_settings.key, "storage_rule_%"));
  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  if (module === "general") {
    const legacy = await db.select().from(system_settings).where(eq(system_settings.key, "max_file_size_mb")).limit(1);
    if (legacy.length > 0) {
      byKey.set("max_file_size_mb", legacy[0].value);
    }
  }

  return parseStoredRule(module, getStoredRuleValue(byKey, module));
}

export function getPublicFileUrl(key: string): string {
  return getR2PublicUrl(key);
}

function getExtension(fileName: string): string {
  const ext = fileName.match(/\.[^./\\]+$/)?.[0] || "";
  return ext.toLowerCase();
}

export function isFileTypeAllowed(fileName: string, fileType: string, allowedTypes: string[]): boolean {
  const normalizedMime = (fileType || "").trim().toLowerCase();
  const normalizedExt = getExtension(fileName);

  return normalizeAllowedTypes(allowedTypes).some((allowed) => {
    if (allowed === "*/*") return true;
    if (allowed.endsWith("/*")) {
      return normalizedMime.startsWith(allowed.slice(0, allowed.length - 1));
    }
    if (allowed.startsWith(".")) {
      return normalizedExt === allowed;
    }
    return normalizedMime === allowed;
  });
}

export async function validateUploadAgainstRules(intent: UploadIntent): Promise<StorageRule> {
  const storageModule = inferStorageModule(intent.category);
  const rule = await getStorageRule(storageModule);
  const maxBytes = rule.maxFileSizeMb * 1024 * 1024;

  if (intent.fileSize > maxBytes) {
    throw new Error(`File too large. Maximum allowed for ${storageModule} uploads is ${rule.maxFileSizeMb}MB.`);
  }

  if (!isFileTypeAllowed(intent.fileName, intent.fileType, rule.allowedFileTypes)) {
    throw new Error(`Unsupported file type. Allowed types for ${storageModule} uploads: ${formatAllowedTypes(rule)}.`);
  }

  return rule;
}

export async function buildUploadPlan(
  userId: string,
  intent: UploadIntent,
  options?: { basePathOverride?: string }
): Promise<UploadPlan> {
  const storageModule = inferStorageModule(intent.category);
  await validateUploadAgainstRules(intent);

  let basePath = options?.basePathOverride || "";
  let projectId: string | null = null;
  let eventId: string | null = null;

  if (!basePath && intent.category === "projects" && intent.entityId) {
    basePath = `projects/${intent.entityId}/media`;
    projectId = intent.entityId;
  } else if (!basePath && intent.category === "events" && intent.entityId) {
    basePath = `events/${intent.entityId}/media`;
    eventId = intent.entityId;
  } else if (!basePath && intent.category === "quizzes" && intent.entityId) {
    basePath = `quizzes/${intent.entityId}/media`;
  } else if (!basePath && intent.category === "users") {
    basePath = `users/${userId}/uploads`;
  } else if (!basePath && intent.category === "profile_images") {
    basePath = `users/${userId}/profile`;
  } else if (!basePath && intent.category === "outreach_images") {
    basePath = `outreach/${intent.entityId || "draft"}/media`;
  } else if (!basePath && intent.category === "achievement_images") {
    basePath = `achievements/${intent.entityId || "draft"}/media`;
  } else if (!basePath && intent.category === "observation_images") {
    basePath = `observations/${userId}/${intent.entityId || "draft"}`;
  } else if (!basePath && intent.category === "article_images") {
    basePath = `articles/${userId}/${intent.entityId || "draft"}`;
  } else if (!basePath && intent.category === "finance_receipts") {
    basePath = `finance/receipts/${userId}`;
  } else if (!basePath && intent.category === "documentation") {
    projectId = intent.projectId ?? null;
    basePath = intent.isGlobal ? "documentation/global/media" : `projects/${intent.projectId}/media`;
  } else if (!basePath && intent.category === "forms") {
    basePath = intent.entityId ? `forms/${intent.entityId}/media` : `forms/${userId}/media`;
  } else if (!basePath) {
    basePath = "general";
  }

  if (!projectId && intent.category === "projects") {
    projectId = intent.entityId ?? null;
  }
  if (!eventId && intent.category === "events") {
    eventId = intent.entityId ?? null;
  }
  if (!projectId && intent.category === "documentation") {
    projectId = intent.projectId ?? null;
  }

  const rawName = intent.fileName.replace(/\.[^/.]+$/, "");
  const ext = intent.fileName.match(/\.[^/.]+$/)?.[0] || "";

  let finalFileName = intent.fileName;
  const existingFiles = await db
    .select()
    .from(files)
    .where(and(like(files.filePath, `${basePath}/${rawName}%${ext}`), eq(files.status, "active")))
    .orderBy(desc(files.version));

  let version = 1;
  if (existingFiles.length > 0) {
    version = existingFiles[0].version + 1;
    finalFileName = `${rawName}_v${version}${ext}`;
  }

  const key = `${basePath}/${finalFileName}`;
  return {
    module: storageModule,
    key,
    finalFileName,
    publicUrl: getPublicFileUrl(key),
    version,
    projectId,
    eventId,
    isPublic: intent.isPublic ?? (intent.category !== "documentation" && intent.category !== "finance_receipts"),
  };
}
