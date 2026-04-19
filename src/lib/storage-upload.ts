import { desc, eq, like, and } from "drizzle-orm";
import { db } from "@/db";
import { files, system_settings } from "@/db/schema";

export type StorageModule = "docs" | "projects" | "forms" | "general";

export type UploadCategory =
  | "projects"
  | "events"
  | "media"
  | "users"
  | "general"
  | "quizzes"
  | "documentation"
  | "forms";

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

const STORAGE_RULE_KEYS: Record<StorageModule, string> = {
  docs: "storage_rule_docs",
  projects: "storage_rule_projects",
  forms: "storage_rule_forms",
  general: "storage_rule_general",
};

const DEFAULT_STORAGE_RULES: StorageRules = {
  docs: {
    maxFileSizeMb: 100,
    allowedFileTypes: ["*/*"],
  },
  projects: {
    maxFileSizeMb: 100,
    allowedFileTypes: ["*/*"],
  },
  forms: {
    maxFileSizeMb: 100,
    allowedFileTypes: ["*/*"],
  },
  general: {
    maxFileSizeMb: 25,
    allowedFileTypes: ["*/*"],
  },
};

function normalizeAllowedTypes(values: string[] | undefined): string[] {
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
  return "general";
}

export function getStorageRuleKey(module: StorageModule): string {
  return STORAGE_RULE_KEYS[module];
}

export async function getStorageRules(): Promise<StorageRules> {
  const rows = await db.select().from(system_settings);
  const byKey = new Map(rows.map((row) => [row.key, row.value]));

  return {
    docs: parseStoredRule("docs", byKey.get(STORAGE_RULE_KEYS.docs)),
    projects: parseStoredRule("projects", byKey.get(STORAGE_RULE_KEYS.projects)),
    forms: parseStoredRule("forms", byKey.get(STORAGE_RULE_KEYS.forms)),
    general: parseStoredRule("general", byKey.get(STORAGE_RULE_KEYS.general) ?? byKey.get("max_file_size_mb")),
  };
}

export async function getStorageRule(module: StorageModule): Promise<StorageRule> {
  const key = STORAGE_RULE_KEYS[module];
  const row = await db.select().from(system_settings).where(eq(system_settings.key, key)).limit(1);
  if (row.length > 0) {
    return parseStoredRule(module, row[0].value);
  }

  if (module === "general") {
    const legacy = await db.select().from(system_settings).where(eq(system_settings.key, "max_file_size_mb")).limit(1);
    if (legacy.length > 0) {
      return parseStoredRule("general", legacy[0].value);
    }
  }

  return DEFAULT_STORAGE_RULES[module];
}

export function getPublicFileUrl(key: string): string {
  const base = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/+$/, "");
  return `${base}/${key}`;
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
      const prefix = allowed.slice(0, allowed.length - 1);
      return normalizedMime.startsWith(prefix);
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
    .where(
      and(
        like(files.filePath, `${basePath}/${rawName}%${ext}`),
        eq(files.status, "active")
      )
    )
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
    isPublic: intent.isPublic ?? (intent.category !== "documentation"),
  };
}
