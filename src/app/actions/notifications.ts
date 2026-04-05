"use server";

import { db } from "@/db";
import { notifications, project_members, projects, users } from "@/db/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";

type NotificationInsert = {
  userId: string;
  type?: "mention" | "task_assigned" | "approval_request" | "system" | "form";
  title: string;
  message: string;
  referenceId?: string | null;
  link?: string | null;
};

export async function createNotificationForUser({
  userId,
  type = "system",
  title,
  message,
  referenceId = null,
  link = null,
}: NotificationInsert) {
  await db.insert(notifications).values({
    id: uuidv4(),
    userId,
    type,
    title,
    message,
    referenceId,
    link,
  });
}

export async function createNotificationsForUsers(
  inserts: NotificationInsert[]
) {
  if (inserts.length === 0) {
    return;
  }

  await db.insert(notifications).values(
    inserts.map((insert) => ({
      id: uuidv4(),
      userId: insert.userId,
      type: insert.type ?? "system",
      title: insert.title,
      message: insert.message,
      referenceId: insert.referenceId ?? null,
      link: insert.link ?? null,
    }))
  );
}

// ─── Notification Actions ──────────────────────────────────────

/**
 * Fetch the current user's notifications, most recent first.
 * Returns up to 50.
 */
export async function getMyNotificationsAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return rows.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    referenceId: n.referenceId,
    link: n.link,
    createdAt: n.createdAt?.toISOString() ?? new Date().toISOString(),
  }));
}

/**
 * Get the count of unread notifications for badge display.
 */
export async function getUnreadNotificationCountAction(): Promise<number> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return 0;

  const result = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false)
      )
    );

  return result[0]?.value ?? 0;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationReadAction(notificationId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, session.user.id)
      )
    );
}

/**
 * Mark ALL of the current user's notifications as read.
 */
export async function markAllNotificationsReadAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return;

  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, session.user.id));
}

// ─── Portal: My Projects Action ────────────────────────────────

/**
 * Fetch projects the current user is assigned to, including progress.
 * Used in the Member Portal to replace hardcoded mock data.
 */
export async function getMyProjectsAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  const memberships = await db
    .select({
      projectId: project_members.projectId,
      memberRole: project_members.role,
    })
    .from(project_members)
    .where(eq(project_members.userId, session.user.id));

  if (memberships.length === 0) return [];

  const results = [];

  for (const m of memberships) {
    const [project] = await db
      .select({
        id: projects.id,
        title: projects.title,
        status: projects.status,
        progress: projects.progress,
      })
      .from(projects)
      .where(eq(projects.id, m.projectId))
      .limit(1);

    if (project) {
      results.push({
        id: project.id,
        name: project.title,
        status: project.status,
        role: m.memberRole === "lead" ? "Lead" : "Member",
        progress: project.progress ?? 0,
      });
    }
  }

  return results;
}
