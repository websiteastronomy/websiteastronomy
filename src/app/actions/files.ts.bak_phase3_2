"use server";

import { db } from "@/db";
import { project_files } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { logActivityAction } from "./activity";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { assertProjectPermission } from "@/lib/project_permissions";

export interface ProjectFile {
  id: string;
  projectId: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  fileSize: string | null;
  mimeType: string | null;
  url: string | null;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function getProjectFilesAction(projectId: string): Promise<ProjectFile[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  await assertProjectPermission(projectId, session?.user?.id, "canView");

  const rows = await db
    .select()
    .from(project_files)
    .where(eq(project_files.projectId, projectId));
  
  // Sort folders first, then alphabetically
  return (rows as unknown as ProjectFile[]).sort((a, b) => {
    if (a.type === "folder" && b.type !== "folder") return -1;
    if (a.type !== "folder" && b.type === "folder") return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function createProjectFolderAction(
  projectId: string,
  name: string,
  parentId: string | null,
  uploadedBy: string = "Unknown"
): Promise<ProjectFile> {
  const session = await auth.api.getSession({ headers: await headers() });
  await assertProjectPermission(projectId, session?.user?.id, "canUpload");

  const id = uuidv4();
  const now = new Date();
  
  const payload = {
    id,
    projectId,
    name,
    type: "folder" as const,
    parentId,
    fileSize: null,
    mimeType: null,
    url: null,
    uploadedBy,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(project_files).values(payload as any);
  await logActivityAction(projectId, uploadedBy, "created_folder", "file", id, name);
  revalidatePath(`/projects`);
  revalidatePath(`/projects/${projectId}`);
  
  return payload;
}

export async function uploadProjectFileAction(
  projectId: string,
  data: {
    name: string;
    parentId: string | null;
    fileSize: string;
    mimeType: string;
    uploadedBy: string;
    url?: string;
  }
): Promise<ProjectFile> {
  const session = await auth.api.getSession({ headers: await headers() });
  await assertProjectPermission(projectId, session?.user?.id, "canUpload");

  const id = uuidv4();
  const now = new Date();
  
  const payload = {
    id,
    projectId,
    name: data.name,
    type: "file" as const,
    parentId: data.parentId,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    url: data.url || `https://mock-storage.local/${id}/${encodeURIComponent(data.name)}`, // Mock URL for now
    uploadedBy: data.uploadedBy || "Unknown",
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(project_files).values(payload as any);
  await logActivityAction(projectId, data.uploadedBy || "Unknown", "uploaded_file", "file", id, data.name);
  revalidatePath(`/projects`);
  revalidatePath(`/projects/${projectId}`);
  
  return payload;
}

export async function deleteProjectFileAction(fileId: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });

  // Get file info before deletion for activity log
  const [file] = await db.select({ projectId: project_files.projectId, name: project_files.name })
    .from(project_files).where(eq(project_files.id, fileId));

  if (!file) return;
  await assertProjectPermission(file.projectId, session?.user?.id, "canEdit");

  await db.delete(project_files).where(eq(project_files.id, fileId));

  if (file) {
    await logActivityAction(file.projectId, "System", "deleted_file", "file", fileId, file.name);
    revalidatePath(`/projects/${file.projectId}`);
  }
  revalidatePath(`/projects`);
}

export async function renameProjectFileAction(
  fileId: string,
  name: string,
  actorName: string = "Unknown"
): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("File name cannot be empty.");
  }

  const [file] = await db
    .select({
      projectId: project_files.projectId,
      name: project_files.name,
    })
    .from(project_files)
    .where(eq(project_files.id, fileId));

  if (!file) {
    throw new Error("File not found.");
  }

  const session = await auth.api.getSession({ headers: await headers() });
  await assertProjectPermission(file.projectId, session?.user?.id, "canEdit");

  await db
    .update(project_files)
    .set({
      name: trimmedName,
      updatedAt: new Date(),
    })
    .where(eq(project_files.id, fileId));

  await logActivityAction(
    file.projectId,
    actorName,
    "renamed_file",
    "file",
    fileId,
    `${file.name} -> ${trimmedName}`
  );
  revalidatePath(`/projects`);
  revalidatePath(`/projects/${file.projectId}`);
}
