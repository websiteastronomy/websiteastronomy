"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/db";
import { system_settings, files, users } from "@/db/schema";
import { eq, desc, and, like } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";

// Configure R2 Client
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

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
  if (!userRes.length || userRes[0].role !== "admin") throw new Error("Unauthorized");

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
  return true;
}

export async function uploadFile(formData: FormData, category: "projects" | "events" | "media" | "users" | "general", entityId?: string, isPublic?: boolean) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const userRes = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!userRes.length) throw new Error("Unauthorized");
  const user = userRes[0];

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  // 1. Validation
  const maxMb = await getSystemMaxFileSize();
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(`File exceeds maximum allowed size of ${maxMb}MB`);
  }

  const fileType = file.type;
  const fileName = file.name;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  // 2. Paths and Versioning
  let basePath = "";
  if (category === "projects" && entityId) {
    basePath = `projects/${entityId}/media`;
  } else if (category === "events" && entityId) {
    basePath = `events/${entityId}/media`;
  } else if (category === "users") {
    basePath = `users/${user.id}/uploads`;
  } else {
    basePath = `general`;
  }

  // Handle versioning
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
  
  // 3. Upload to R2 directly from Backend
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

  // 4. Save metadata
  const fileId = uuidv4();
  await db.insert(files).values({
    id: fileId,
    fileName: finalFileName,
    fileUrl: publicUrl,
    filePath: finalPath,
    fileSize: file.size,
    fileType: fileType,
    projectId: category === "projects" ? entityId : null,
    eventId: category === "events" ? entityId : null,
    uploadedBy: user.id,
    version: version,
    isPublic: isPublic ?? true,
    status: "active",
  });

  return { fileUrl: publicUrl, fileId, fileName: finalFileName };
}
