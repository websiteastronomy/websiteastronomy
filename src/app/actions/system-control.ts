"use server";

import { db } from "@/db";
import { settingsTable, users } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser, getSystemAccess } from "@/lib/system-rbac";
import {
  DEFAULT_SYSTEM_CONTROL_SETTINGS,
  normalizeSystemControlSettings,
  type SystemControlSettings,
} from "@/lib/system-control";
import { logActivity } from "@/lib/activity-logs";
import { attachUserLifecycleState, isLifecycleVisibleInStandardQueries } from "@/lib/user-lifecycle";
import { getSystemConfig, updateSystemConfig } from "@/lib/system-modules";

const SYSTEM_CONTROL_SETTINGS_ID = "system_control";

async function requireSystemControlAccess() {
  const user = await requireAuthenticatedUser();
  const access = await getSystemAccess(user.id);
  if (!access.isAdmin) {
    throw new Error("Forbidden");
  }
  return { user, access };
}

export async function getSystemControlSettingsAction(): Promise<SystemControlSettings> {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, SYSTEM_CONTROL_SETTINGS_ID)).limit(1);
  if (!rows.length) {
    return DEFAULT_SYSTEM_CONTROL_SETTINGS;
  }
  return normalizeSystemControlSettings(rows[0].data);
}

export async function updateSystemControlSettingsAction(input: SystemControlSettings) {
  const { user, access } = await requireSystemControlAccess();
  const normalized = normalizeSystemControlSettings(input);
  const currentConfig = await getSystemConfig();
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.id, SYSTEM_CONTROL_SETTINGS_ID)).limit(1);

  if (existing.length) {
    await db.update(settingsTable).set({ data: normalized, updatedAt: new Date() }).where(eq(settingsTable.id, SYSTEM_CONTROL_SETTINGS_ID));
  } else {
    await db.insert(settingsTable).values({
      id: SYSTEM_CONTROL_SETTINGS_ID,
      data: normalized,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await logActivity({
    userId: user.id,
    action: "update_system_control",
    entityType: "system_control",
    entityId: SYSTEM_CONTROL_SETTINGS_ID,
    details: normalized as unknown as Record<string, unknown>,
    role: access.roleName,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/portal");

  await updateSystemConfig({
    ...currentConfig,
    featureFlags: {
      ...currentConfig.featureFlags,
      attendance: normalized.features.attendanceEnabled,
      email: normalized.features.emailEnabled,
      notifications: normalized.features.notificationsEnabled,
      fileUploads: normalized.features.fileUploadsEnabled,
      storage: normalized.features.fileUploadsEnabled,
      users: true,
    },
    modules: {
      ...currentConfig.modules,
      attendance: { ...currentConfig.modules.attendance, enabled: normalized.features.attendanceEnabled },
      email: { ...currentConfig.modules.email, enabled: normalized.features.emailEnabled },
      notifications: { ...currentConfig.modules.notifications, enabled: normalized.features.notificationsEnabled },
      fileUploads: { ...currentConfig.modules.fileUploads, enabled: normalized.features.fileUploadsEnabled },
      storage: { ...currentConfig.modules.storage, enabled: normalized.features.fileUploadsEnabled },
    },
  });

  return normalized;
}

export async function getSystemControlPublicSnapshotAction() {
  const settings = await getSystemControlSettingsAction();
  return settings;
}

export async function getAnnouncementTargetUsersByRoles(roleNames: string[]) {
  if (!roleNames.length) {
    return [];
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(inArray(users.role, roleNames.map((role) => role.toLowerCase())));

  const visibleRows = (await attachUserLifecycleState(rows)).filter((row) =>
    row.status === "approved" && isLifecycleVisibleInStandardQueries(row.lifecycleState)
  );
  return visibleRows;
}
