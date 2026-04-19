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
