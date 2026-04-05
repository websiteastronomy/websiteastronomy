"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/db";
import { system_settings, files, users } from "@/db/schema";
import { eq, desc, and, like } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { hasPermission } from "@/lib/permissions";
import { getSystemAccess } from "@/lib/system-rbac";
import { logActivity } from "@/lib/activity-logs";
import { assertProjectPermission } from "@/lib/project_permissions";

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
  projectId?: string | null;
  eventId?: string | null;
  isPublic?: boolean;
};

async function storeBinaryFile({
  file,
  userId,
  basePath,
  projectId = null,
  eventId = null,
  isPublic = true,
}: BinaryUploadOptions) {
  const maxMb = await getSystemMaxFileSize();
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(`File exceeds maximum allowed size of ${maxMb}MB`);
  }

  const fileType = file.type;
  const fileName = file.name;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  let finalFileName = fileName;
  const rawName = fileName.replace(/\.[^/.]+$/, "");
  const ext = fileName.match(/\.[^/.]+$/)?.[0] || "";

  const existingFiles = await db.select()
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

  const finalPath = `${basePath}/${finalFileName}`;
  const bucket = process.env.R2_BUCKET_NAME || "";

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: finalPath,
    Body: fileBuffer,
    ContentType: fileType,
    ContentLength: file.size
  });

  await r2.send(command);

  const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  const publicUrl = `${publicBaseUrl}/${finalPath}`;

  const fileId = uuidv4();
  await db.insert(files).values({
    id: fileId,
    fileName: finalFileName,
    fileUrl: publicUrl,
    filePath: finalPath,
    fileSize: file.size,
    fileType: fileType,
    projectId,
    eventId,
    uploadedBy: userId,
    version,
    isPublic,
    status: "active",
  });

  return { fileUrl: publicUrl, fileId, fileName: finalFileName };
}

export async function getSystemMaxFileSize(): Promise<number> {
  const setting = await db.select().from(system_settings).where(eq(system_settings.key, "max_file_size_mb")).limit(1);
  if (setting.length > 0) {
    return parseInt(setting[0].value, 10);
  }
  
  // Initialize default if not exists
  await db.insert(system_settings).values({
    id: uuidv4(),
    key: "max_file_size_mb",
    value: "10"
  });
  return 10;
}

export async function setSystemMaxFileSize(mb: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  
  const userRes = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!userRes.length) throw new Error("Unauthorized");
  // Only users with assign_roles permission (Admins in RBAC) may change storage limits.
  if (!await hasPermission(session.user.id, "assign_roles")) throw new Error("Unauthorized: Admin access required");

  if (mb < 1 || mb > 100) throw new Error("Size must be between 1MB and 100MB");

  const existing = await db.select().from(system_settings).where(eq(system_settings.key, "max_file_size_mb")).limit(1);
  if (existing.length > 0) {
    await db.update(system_settings).set({ value: mb.toString(), updatedAt: new Date() }).where(eq(system_settings.key, "max_file_size_mb"));
  } else {
    await db.insert(system_settings).values({
      id: uuidv4(),
      key: "max_file_size_mb",
      value: mb.toString()
    });
  }
  const access = await getSystemAccess(session.user.id);
  await logActivity({
    userId: session.user.id,
    action: "update_storage_settings",
    entityType: "system_settings",
    entityId: "max_file_size_mb",
    role: access.roleName,
    details: { maxFileSizeMb: mb },
  });
  return true;
}

export async function uploadFile(formData: FormData, category: "projects" | "events" | "media" | "users" | "general" | "quizzes", entityId?: string, isPublic?: boolean) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const userRes = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!userRes.length) throw new Error("Unauthorized");
  const user = userRes[0];
  const access = await getSystemAccess(user.id);

  if (category === "projects" && !access.canManageProjects) {
    throw new Error("Unauthorized: Project upload access required");
  }

  if (category === "events" && !access.canManageEvents) {
    throw new Error("Unauthorized: Event upload access required");
  }

  if ((category === "media" || category === "general") && !access.isAdmin) {
    throw new Error("Unauthorized: Admin upload access required");
  }

  if (category === "quizzes" && !access.isAdmin && !access.canApproveActions) {
    throw new Error("Unauthorized: Quiz upload access required");
  }

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

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

  const access = await getSystemAccess(session.user.id);
  const isGlobal = options.isGlobal ?? false;
  const projectId = options.projectId ?? null;

  if (isGlobal) {
    if (!(access.isAdmin || access.canManageProjects || access.canApproveActions)) {
      throw new Error("Unauthorized: Documentation upload access required");
    }
  } else if (projectId) {
    await assertProjectPermission(projectId, session.user.id, "canUpload");
  } else {
    throw new Error("A projectId is required for non-global documentation uploads.");
  }

  const basePath = isGlobal ? "documentation/global/media" : `projects/${projectId}/media`;

  return storeBinaryFile({
    file,
    userId: session.user.id,
    basePath,
    projectId,
    isPublic: false,
  });
}
