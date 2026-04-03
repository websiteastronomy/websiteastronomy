"use server";

import { v4 as uuidv4 } from "uuid";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { announcements, roles, users } from "@/db/schema";
import { createNotificationsForUsers } from "@/app/actions/notifications";
import { sendEmail } from "@/lib/email";
import { logActivity } from "@/lib/activity-logs";
import { getSystemAccess, requireAuthenticatedUser } from "@/lib/system-rbac";

type AnnouncementInput = {
  title: string;
  message: string;
  targetRoles: string[];
  sendEmail: boolean;
  sendNotification: boolean;
};

const ROLE_ALIASES: Record<string, string[]> = {
  admin: ["admin", "Admin"],
  core: ["core", "Core Committee"],
  lead: ["lead", "Lead"],
  member: ["member", "Member"],
  none: ["none"],
};

async function requireAnnouncementAccess() {
  const user = await requireAuthenticatedUser();
  const access = await getSystemAccess(user.id);
  if (!(access.isAdmin || access.canApproveActions)) {
    throw new Error("Forbidden");
  }
  return { user, access };
}

function normalizeRoleTargets(targetRoles: string[]) {
  return Array.from(new Set(targetRoles.map((role) => role.trim()).filter(Boolean)));
}

function expandRoleTargets(targetRoles: string[]) {
  return Array.from(
    new Set(
      targetRoles.flatMap((role) => {
        const normalized = role.trim();
        const aliasKey = normalized.toLowerCase();
        return ROLE_ALIASES[aliasKey] || [normalized];
      })
    )
  );
}

function isMissingAnnouncementsTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("announcements") && (
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("Failed query")
  );
}

export async function getAnnouncementRoleOptionsAction() {
  const user = await requireAuthenticatedUser();
  const access = await getSystemAccess(user.id);
  if (!(access.isAdmin || access.canApproveActions)) {
    throw new Error("Forbidden");
  }

  const roleRows = await db.select().from(roles);
  return roleRows.map((role) => role.name);
}

export async function createAnnouncementAction(input: AnnouncementInput) {
  const { user, access } = await requireAnnouncementAccess();
  const title = input.title.trim();
  const message = input.message.trim();
  const targetRoles = normalizeRoleTargets(input.targetRoles);
  const announcementId = uuidv4();
  const expandedTargets = expandRoleTargets(targetRoles);

  if (!title || !message) {
    throw new Error("Title and message are required.");
  }

  await db.insert(announcements).values({
    id: announcementId,
    title,
    message,
    targetRoles,
    sendEmail: Boolean(input.sendEmail),
    sendNotification: Boolean(input.sendNotification),
    createdBy: user.id,
    createdAt: new Date(),
  });

  const recipients = targetRoles.length
    ? await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          status: users.status,
        })
        .from(users)
        .where(and(inArray(users.role, expandedTargets.map((role) => role.toLowerCase())), eq(users.status, "approved")))
    : [];

  if (input.sendNotification && recipients.length) {
    await createNotificationsForUsers(
      recipients.map((recipient) => ({
        userId: recipient.id,
        type: "system" as const,
        title,
        message,
        link: "/portal",
      }))
    );
  }

  if (input.sendEmail && recipients.length) {
    await Promise.all(
      recipients
        .filter((recipient) => recipient.email)
        .map((recipient) =>
          sendEmail({
            to: recipient.email,
            subject: `Astronomy Club Announcement: ${title}`,
            text: message,
            html: `<div style="font-family:sans-serif;line-height:1.6"><h2>${title}</h2><p>${message}</p></div>`,
          }).catch((error) => {
            console.error("[announcements] email send failed:", error);
          })
        )
    );
  }

  await logActivity({
    userId: user.id,
    action: "create_announcement",
    entityType: "announcement",
    entityId: announcementId,
    role: access.roleName,
    details: {
      title,
      message,
      targetRoles,
      sendEmail: Boolean(input.sendEmail),
      sendNotification: Boolean(input.sendNotification),
    },
  });

  return { success: true, id: announcementId };
}

export async function getAnnouncementsAction() {
  try {
    const rows = await db
      .select({
        id: announcements.id,
        title: announcements.title,
        message: announcements.message,
        targetRoles: announcements.targetRoles,
        sendEmail: announcements.sendEmail,
        sendNotification: announcements.sendNotification,
        createdBy: announcements.createdBy,
        createdAt: announcements.createdAt,
      })
      .from(announcements)
      .orderBy(desc(announcements.createdAt))
      .limit(100);

    return rows.map((row) => ({
      ...row,
      targetRoles: Array.isArray(row.targetRoles) ? row.targetRoles : [],
      createdAt: row.createdAt?.toISOString() || null,
    }));
  } catch (error) {
    if (isMissingAnnouncementsTableError(error)) {
      console.warn("[announcements] table not available yet; returning empty announcement list.");
      return [];
    }
    throw error;
  }
}

export async function getMyAnnouncementsAction() {
  const user = await requireAuthenticatedUser();
  const access = await getSystemAccess(user.id);
  const roleName = access.roleName || "none";
  const roleCandidates = expandRoleTargets([roleName]);
  let rows;
  try {
    rows = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(25);
  } catch (error) {
    if (isMissingAnnouncementsTableError(error)) {
      console.warn("[announcements] table not available yet; returning empty personal announcements.");
      return [];
    }
    throw error;
  }

  return rows
    .filter((row) => {
      const targets = Array.isArray(row.targetRoles) ? row.targetRoles.map((item) => String(item).toLowerCase()) : [];
      if (!targets.length) return true;
      return roleCandidates.some((candidate) => targets.includes(candidate.toLowerCase()));
    })
    .map((row) => ({
      ...row,
      targetRoles: Array.isArray(row.targetRoles) ? row.targetRoles : [],
      createdAt: row.createdAt?.toISOString() || null,
    }));
}
