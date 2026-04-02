"use server";

import { db } from "@/db";
import { project_activity } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

export interface ProjectActivity {
  id: string;
  projectId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityTitle: string | null;
  createdAt: Date;
}



export async function getProjectActivityAction(projectId: string): Promise<ProjectActivity[]> {
  const rows = await db
    .select()
    .from(project_activity)
    .where(eq(project_activity.projectId, projectId))
    .orderBy(desc(project_activity.createdAt))
    .limit(20);

  return rows as unknown as ProjectActivity[];
}

/**
 * Internal helper — called by all other server actions to log activity.
 * Does NOT revalidate paths to avoid double-revalidation; callers handle that.
 */
export async function logActivityAction(
  projectId: string,
  actorName: string,
  action: string,
  entityType: string,
  entityId?: string,
  entityTitle?: string
): Promise<void> {
  try {
    await db.insert(project_activity).values({
      id: uuidv4(),
      projectId,
      actorName,
      action,
      entityType,
      entityId: entityId ?? null,
      entityTitle: entityTitle ?? null,
      createdAt: new Date(),
    });
  } catch (err) {
    // Activity logging should never break primary flows
    console.error("[logActivity] Failed:", err);
  }
}
