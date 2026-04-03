"use server";

import { db } from "@/db";
import { project_discussion } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { logActivityAction } from "./activity";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { assertProjectPermission } from "@/lib/project_permissions";

export interface ProjectDiscussionMessage {
  id: string;
  projectId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  isPinned: boolean;
  replyToId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export async function getProjectDiscussionAction(projectId: string): Promise<ProjectDiscussionMessage[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  await assertProjectPermission(projectId, session?.user?.id, "canView");

  const rows = await db
    .select()
    .from(project_discussion)
    .where(eq(project_discussion.projectId, projectId))
    .orderBy(asc(project_discussion.createdAt)); // Oldest first is standard for chat, though we might sort in UI

  return rows as unknown as ProjectDiscussionMessage[];
}

export async function addDiscussionMessageAction(
  projectId: string,
  data: {
    authorName: string;
    authorAvatar: string;
    text: string;
    replyToId?: string | null;
  }
): Promise<ProjectDiscussionMessage> {
  const session = await auth.api.getSession({ headers: await headers() });
  await assertProjectPermission(projectId, session?.user?.id, "canComment");

  const id = uuidv4();
  const now = new Date();

  const payload = {
    id,
    projectId,
    authorName: data.authorName,
    authorAvatar: data.authorAvatar,
    text: data.text,
    isPinned: false,
    replyToId: data.replyToId || null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(project_discussion).values(payload as any);
  await logActivityAction(projectId, data.authorName, "sent_message", "discussion", id, data.text.substring(0, 60));
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  return payload;
}

export async function togglePinDiscussionMessageAction(messageId: string, isPinned: boolean): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  const [msg] = await db.select({ projectId: project_discussion.projectId }).from(project_discussion).where(eq(project_discussion.id, messageId));
  if (!msg) return;
  await assertProjectPermission(msg.projectId, session?.user?.id, "canEdit");

  await db
    .update(project_discussion)
    .set({ isPinned, updatedAt: new Date() })
    .where(eq(project_discussion.id, messageId));
  
  revalidatePath("/projects");
}

export async function deleteDiscussionMessageAction(messageId: string): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  const [msg] = await db.select({ projectId: project_discussion.projectId, text: project_discussion.text })
    .from(project_discussion).where(eq(project_discussion.id, messageId));

  if (!msg) return;
  await assertProjectPermission(msg.projectId, session?.user?.id, "canEdit");

  await db.delete(project_discussion).where(eq(project_discussion.id, messageId));

  if (msg) {
    await logActivityAction(msg.projectId, "System", "deleted_message", "discussion", messageId, msg.text.substring(0, 60));
    revalidatePath(`/projects/${msg.projectId}`);
  }
  revalidatePath("/projects");
}
