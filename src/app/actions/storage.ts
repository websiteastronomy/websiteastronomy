"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/db";
import { system_settings, files, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { hasPermission } from "@/lib/permissions";
import { getSystemAccess } from "@/lib/system-rbac";
import { logActivity } from "@/lib/activity-logs";
import { assertProjectPermission } from "@/lib/project_permissions";
import { getFinanceAccess } from "@/lib/finance";
import {
  type StorageModule,
  type StorageRule,
  type StorageRules,
  type UploadIntent,
  buildUploadPlan,
  getPublicFileUrl,
  getStorageRule,
  getStorageRules,
  serializeStorageRule,
  validateUploadAgainstRules,
} from "@/lib/storage-upload";

// Configure R2 Client
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

type BinaryUploadOptions = {
  file: File;
  userId: string;
  basePath: string;
  category?: UploadIntent["category"];
  projectId?: string | null;
  eventId?: string | null;
  isPublic?: boolean;
};

async function storeBinaryFile({
  file,
  userId,
  basePath,
  category = "general",
  projectId = null,
  eventId = null,
  isPublic = true,
}: BinaryUploadOptions) {
  const fileType = file.type;
  const fileName = file.name;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const uploadPlan = await buildUploadPlan(userId, {
    category,
    fileName,
    fileType,
    fileSize: file.size,
    entityId: projectId ?? eventId ?? undefined,
    projectId,
    isGlobal: basePath.startsWith("documentation/global/"),
    isPublic,
  }, { basePathOverride: basePath });
  const finalPath = uploadPlan.key;
  const bucket = process.env.R2_BUCKET_NAME || "";

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: finalPath,
    Body: fileBuffer,
    ContentType: fileType,
    ContentLength: file.size
  });

  await r2.send(command);

  const publicUrl = uploadPlan.publicUrl;

  const fileId = uuidv4();
  await db.insert(files).values({
    id: fileId,
    fileName: uploadPlan.finalFileName,
    fileUrl: publicUrl,
    filePath: finalPath,
    fileSize: file.size,
    fileType: fileType,
    projectId: uploadPlan.projectId,
    eventId: uploadPlan.eventId,
    uploadedBy: userId,
    version: uploadPlan.version,
    isPublic: uploadPlan.isPublic,
    status: "active",
  });

  return { fileUrl: publicUrl, fileId, fileName: uploadPlan.finalFileName };
}

export async function getSystemMaxFileSize(): Promise<number> {
  return (await getStorageRule("general")).maxFileSizeMb;
}

export async function setSystemMaxFileSize(mb: number) {
  await updateStorageRulesAction({
    general: {
      maxFileSizeMb: mb,
      allowedFileTypes: ["*/*"],
    },
    docs: await getStorageRule("docs"),
    projects: await getStorageRule("projects"),
    forms: await getStorageRule("forms"),
  });
  return true;
}

export async function getStorageRulesAction(): Promise<StorageRules> {
  return getStorageRules();
}

export async function getStorageRuleAction(module: StorageModule): Promise<StorageRule> {
  return getStorageRule(module);
}

export async function updateStorageRulesAction(nextRules: StorageRules) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  
  const userRes = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!userRes.length) throw new Error("Unauthorized");
  // Only users with assign_roles permission (Admins in RBAC) may change storage limits.
  if (!await hasPermission(session.user.id, "assign_roles")) throw new Error("Unauthorized: Admin access required");

  for (const storageModule of Object.keys(nextRules) as StorageModule[]) {
    const rule = nextRules[storageModule];
    if (rule.maxFileSizeMb < 1 || rule.maxFileSizeMb > 500) {
      throw new Error(`Size for ${storageModule} must be between 1MB and 500MB`);
    }
  }

  for (const storageModule of Object.keys(nextRules) as StorageModule[]) {
    const key =
      storageModule === "docs"
        ? "storage_rule_docs"
        : storageModule === "projects"
          ? "storage_rule_projects"
          : storageModule === "forms"
            ? "storage_rule_forms"
            : "storage_rule_general";
    const value = serializeStorageRule(nextRules[storageModule]);
    const existing = await db.select().from(system_settings).where(eq(system_settings.key, key)).limit(1);
    if (existing.length > 0) {
      await db.update(system_settings).set({ value, updatedAt: new Date() }).where(eq(system_settings.key, key));
    } else {
      await db.insert(system_settings).values({
        id: uuidv4(),
        key,
        value,
      });
    }
  }

  const access = await getSystemAccess(session.user.id);
  await logActivity({
    userId: session.user.id,
    action: "update_storage_settings",
    entityType: "system_settings",
    entityId: "storage_rules",
    role: access.roleName,
    details: nextRules,
  });
  return true;
}

async function assertUploadPermission(userId: string, intent: UploadIntent) {
  const access = await getSystemAccess(userId);

  if (intent.category === "projects" && !access.canManageProjects) {
    throw new Error("Unauthorized: Project upload access required");
  }

  if (intent.category === "events" && !access.canManageEvents) {
    throw new Error("Unauthorized: Event upload access required");
  }

  if ((intent.category === "media" || intent.category === "general") && !access.isAdmin) {
    throw new Error("Unauthorized: Admin upload access required");
  }

  if (intent.category === "quizzes" && !access.isAdmin && !access.canApproveActions) {
    throw new Error("Unauthorized: Quiz upload access required");
  }

  if (intent.category === "documentation") {
    if (intent.isGlobal) {
      if (!(access.isAdmin || access.canManageProjects || access.canApproveActions)) {
        throw new Error("Unauthorized: Documentation upload access required");
      }
    } else if (intent.projectId) {
      await assertProjectPermission(intent.projectId, userId, "canUpload");
    } else {
      throw new Error("A projectId is required for non-global documentation uploads.");
    }
  }

  if (intent.category === "forms" && intent.projectId) {
    await assertProjectPermission(intent.projectId, userId, "canUpload");
  }
}

export async function finalizeDirectUploadAction(
  intent: UploadIntent & { fileKey: string }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  await assertUploadPermission(session.user.id, intent);
  await validateUploadAgainstRules(intent);

  const uploadPlan = await buildUploadPlan(session.user.id, intent);
  if (uploadPlan.key !== intent.fileKey) {
    throw new Error("Upload metadata mismatch. Please retry the upload.");
  }

  const existing = await db.select().from(files).where(eq(files.filePath, uploadPlan.key)).limit(1);
  if (existing.length > 0) {
    return {
      fileUrl: existing[0].fileUrl,
      fileId: existing[0].id,
      fileName: existing[0].fileName,
    };
  }

  const fileId = uuidv4();
  await db.insert(files).values({
    id: fileId,
    fileName: uploadPlan.finalFileName,
    fileUrl: getPublicFileUrl(uploadPlan.key),
    filePath: uploadPlan.key,
    fileSize: intent.fileSize,
    fileType: intent.fileType || "application/octet-stream",
    projectId: uploadPlan.projectId,
    eventId: uploadPlan.eventId,
    uploadedBy: session.user.id,
    version: uploadPlan.version,
    isPublic: uploadPlan.isPublic,
    status: "active",
  });

  return {
    fileUrl: getPublicFileUrl(uploadPlan.key),
    fileId,
    fileName: uploadPlan.finalFileName,
  };
}

export async function uploadFile(formData: FormData, category: "projects" | "events" | "media" | "users" | "general" | "quizzes", entityId?: string, isPublic?: boolean) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const userRes = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!userRes.length) throw new Error("Unauthorized");
  const user = userRes[0];
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");
  await assertUploadPermission(session.user.id, {
    category,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    entityId,
    isPublic,
  });
  await validateUploadAgainstRules({
    category,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    entityId,
    isPublic,
  });

  // 2. Paths and Versioning
  let basePath = "";
  if (category === "projects" && entityId) {
    basePath = `projects/${entityId}/media`;
  } else if (category === "events" && entityId) {
    basePath = `events/${entityId}/media`;
  } else if (category === "quizzes" && entityId) {
    basePath = `quizzes/${entityId}/media`;
  } else if (category === "users") {
    basePath = `users/${user.id}/uploads`;
  } else {
    basePath = `general`;
  }

  return storeBinaryFile({
    file,
    userId: user.id,
    basePath,
    category,
    projectId: category === "projects" ? entityId : null,
    eventId: category === "events" ? entityId : null,
    isPublic: isPublic ?? true,
  });
}

export async function uploadDocumentationBinaryAction(
  formData: FormData,
  options: { projectId?: string | null; isGlobal?: boolean }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");
  const isGlobal = options.isGlobal ?? false;
  const projectId = options.projectId ?? null;
  await assertUploadPermission(session.user.id, {
    category: "documentation",
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    projectId,
    isGlobal,
    isPublic: false,
  });

  const basePath = isGlobal ? "documentation/global/media" : `projects/${projectId}/media`;

  return storeBinaryFile({
    file,
    userId: session.user.id,
    basePath,
    category: "documentation",
    projectId,
    isPublic: false,
  });
}

export async function uploadExpenseReceiptAction(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const access = await getFinanceAccess(session.user.id);
  if (!access.canSubmitExpenses) {
    throw new Error("Unauthorized: Finance receipt upload access required");
  }

  return storeBinaryFile({
    file,
    userId: session.user.id,
    basePath: `finance/receipts/${session.user.id}`,
    category: "general",
    isPublic: false,
  });
}
