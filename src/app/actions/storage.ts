"use server";

import { and, eq, inArray, like } from "drizzle-orm";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files, system_settings, users } from "@/db/schema";
import { getFinanceAccess } from "@/lib/finance";
import { logActivity } from "@/lib/activity-logs";
import { hasPermission } from "@/lib/permissions";
import { assertProjectPermission } from "@/lib/project_permissions";
import { deleteR2Objects, extractR2KeyFromUrl } from "@/lib/r2-storage";
import { isFeatureEnabled } from "@/lib/system-modules";
import { getSystemAccess } from "@/lib/system-rbac";
import {
  buildUploadPlan,
  getPublicFileUrl,
  getStorageRule,
  getStorageRuleKey,
  getStorageRules,
  serializeStorageRule,
  type StorageModule,
  type StorageRule,
  type StorageRules,
  type UploadIntent,
  validateUploadAgainstRules,
} from "@/lib/storage-upload";

async function requireSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function getSystemMaxFileSize(): Promise<number> {
  return (await getStorageRule("general")).maxFileSizeMb;
}

export async function setSystemMaxFileSize(mb: number) {
  await updateStorageRulesAction({
    ...(await getStorageRules()),
    general: {
      maxFileSizeMb: mb,
      allowedFileTypes: ["*/*"],
    },
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
  const user = await requireSessionUser();
  const userRes = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!userRes.length) throw new Error("Unauthorized");
  if (!(await hasPermission(user.id, "assign_roles"))) throw new Error("Unauthorized: Admin access required");

  for (const storageModule of Object.keys(nextRules) as StorageModule[]) {
    const rule = nextRules[storageModule];
    if (rule.maxFileSizeMb < 1 || rule.maxFileSizeMb > 500) {
      throw new Error(`Size for ${storageModule} must be between 1MB and 500MB`);
    }
  }

  for (const storageModule of Object.keys(nextRules) as StorageModule[]) {
    const key = getStorageRuleKey(storageModule);
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

  const access = await getSystemAccess(user.id);
  await logActivity({
    userId: user.id,
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

  if ((intent.category === "media" || intent.category === "general" || intent.category === "outreach_images" || intent.category === "achievement_images") && !access.isAdmin) {
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

  if (intent.category === "finance_receipts") {
    const financeAccess = await getFinanceAccess(userId);
    if (!financeAccess.canSubmitExpenses) {
      throw new Error("Unauthorized: Finance receipt upload access required");
    }
  }
}

export async function finalizeDirectUploadAction(intent: UploadIntent & { fileKey: string }) {
  if (!(await isFeatureEnabled("fileUploads"))) {
    throw new Error("File uploads are currently disabled");
  }

  const user = await requireSessionUser();
  await assertUploadPermission(user.id, intent);
  await validateUploadAgainstRules(intent);

  const uploadPlan = await buildUploadPlan(user.id, intent);
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
    uploadedBy: user.id,
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

export async function finalizeProfileImageUploadAction(input: {
  fileKey: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}) {
  const user = await requireSessionUser();
  const current = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const previousKey = current[0]?.profileImageKey || null;

  const finalized = await finalizeDirectUploadAction({
    category: "profile_images",
    fileKey: input.fileKey,
    fileName: input.fileName,
    fileType: input.fileType,
    fileSize: input.fileSize,
    isPublic: true,
  });

  await db
    .update(users)
    .set({
      profileImageKey: input.fileKey,
      image: input.fileUrl,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  if (previousKey && previousKey !== input.fileKey) {
    await db.update(files).set({ status: "deleted" }).where(eq(files.filePath, previousKey));
    await deleteR2Objects([previousKey]);
  }

  return {
    ...finalized,
    url: input.fileUrl,
    key: input.fileKey,
  };
}

export async function cleanupReplacedUploadsAction(input: { urls?: string[]; keys?: string[] }) {
  const user = await requireSessionUser();
  const access = await getSystemAccess(user.id);

  const keys = Array.from(
    new Set([
      ...(input.keys || []),
      ...((input.urls || []).map((url) => extractR2KeyFromUrl(url)).filter(Boolean) as string[]),
    ])
  );

  if (!keys.length) {
    return { success: true };
  }

  const allowedKeys = keys.filter((key) => {
    if (key.startsWith(`users/${user.id}/`)) return true;
    if (key.startsWith(`observations/${user.id}/`)) return true;
    if (key.startsWith(`articles/${user.id}/`)) return true;
    return access.isAdmin;
  });

  if (!allowedKeys.length) {
    return { success: true };
  }

  await db.update(files).set({ status: "deleted" }).where(inArray(files.filePath, allowedKeys));
  await deleteR2Objects(allowedKeys);

  return { success: true };
}

export async function cleanupLegacyUploadReferencesAction(filePaths: string[]) {
  const user = await requireSessionUser();
  const access = await getSystemAccess(user.id);
  if (!access.isAdmin) throw new Error("Unauthorized");

  const activeRows = await db
    .select({ filePath: files.filePath })
    .from(files)
    .where(and(inArray(files.filePath, filePaths), eq(files.status, "active")));

  const keys = activeRows.map((row) => row.filePath);
  if (!keys.length) {
    return { success: true };
  }

  await db.update(files).set({ status: "deleted" }).where(inArray(files.filePath, keys));
  await deleteR2Objects(keys);

  return { success: true };
}
