"use server";

import { db } from "@/db";
import { project_timeline } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { logActivityAction } from "./activity";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { assertProjectPermission } from "@/lib/project_permissions";

export interface ProjectTimelineEntry {
  id: string;
  projectId: string;
  title: string;
  description: string;
  date: string;
  typeTag: string;
  attachedFiles: any[]; // e.g. [{ name: string, url: string }]
  createdAt: Date;
  updatedAt: Date;
}

export async function getProjectTimelineAction(projectId: string): Promise<ProjectTimelineEntry[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  await assertProjectPermission(projectId, session?.user?.id, "canView");

  const rows = await db
    .select()
    .from(project_timeline)
    .where(eq(project_timeline.projectId, projectId))
    .orderBy(desc(project_timeline.date));

  return rows as unknown as ProjectTimelineEntry[];
}

export async function addTimelineEntryAction(
  projectId: string,
  data: {
    title: string;
    description: string;
    date: string;
    typeTag: string; // "Milestone" | "Update" | "Issue" | "Success"
    attachedFiles?: any[];
  }
): Promise<ProjectTimelineEntry> {
  const session = await auth.api.getSession({ headers: await headers() });
  await assertProjectPermission(projectId, session?.user?.id, "canEdit");

  const id = uuidv4();
  const now = new Date();

  // If date isn't supplied (e.g. from an older form), default to YYYY-MM-DD
  const resolvedDate = data.date || now.toISOString().split("T")[0];

  const payload = {
    id,
    projectId,
    title: data.title,
    description: data.description,
    date: resolvedDate,
    typeTag: data.typeTag || "Update",
    attachedFiles: data.attachedFiles || [],
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(project_timeline).values(payload as any);
  await logActivityAction(projectId, "System", "added_timeline", "timeline", id, data.title);
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  return payload;
}

export async function deleteTimelineEntryAction(entryId: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });

  const [entry] = await db.select({ projectId: project_timeline.projectId, title: project_timeline.title })
    .from(project_timeline).where(eq(project_timeline.id, entryId));

  if (!entry) return;
  await assertProjectPermission(entry.projectId, session?.user?.id, "canEdit");

  await db.delete(project_timeline).where(eq(project_timeline.id, entryId));

  if (entry) {
    await logActivityAction(entry.projectId, "System", "deleted_timeline", "timeline", entryId, entry.title);
    revalidatePath(`/projects/${entry.projectId}`);
  }
  revalidatePath("/projects");
}
