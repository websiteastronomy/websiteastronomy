import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settingsTable } from "@/db/schema";

export type ManagedModuleKey = "attendance" | "users" | "storage" | "notifications" | "email" | "fileUploads";

export type ManagedModuleConfig = {
  enabled: boolean;
  version: number;
};

export type AttendanceRules = {
  duplicateWindowMinutes: number;
  requireApproval: boolean;
};

export type CentralSystemConfig = {
  version: 1;
  featureFlags: Record<ManagedModuleKey, boolean>;
  modules: Record<ManagedModuleKey, ManagedModuleConfig>;
  attendanceRules: AttendanceRules;
  rollout: {
    compatibilityMode: boolean;
  };
};

const SYSTEM_CONFIG_ID = "system_config";

export const DEFAULT_SYSTEM_CONFIG: CentralSystemConfig = {
  version: 1,
  featureFlags: {
    attendance: true,
    users: true,
    storage: true,
    notifications: true,
    email: true,
    fileUploads: true,
  },
  modules: {
    attendance: { enabled: true, version: 1 },
    users: { enabled: true, version: 1 },
    storage: { enabled: true, version: 1 },
    notifications: { enabled: true, version: 1 },
    email: { enabled: true, version: 1 },
    fileUploads: { enabled: true, version: 1 },
  },
  attendanceRules: {
    duplicateWindowMinutes: 15,
    requireApproval: true,
  },
  rollout: {
    compatibilityMode: true,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeModuleConfig(value: unknown, fallback: ManagedModuleConfig): ManagedModuleConfig {
  if (!isRecord(value)) return fallback;
  return {
    enabled: value.enabled !== false,
    version: typeof value.version === "number" && Number.isFinite(value.version) ? Math.max(1, Math.floor(value.version)) : fallback.version,
  };
}

export function normalizeSystemConfig(value: unknown): CentralSystemConfig {
  if (!isRecord(value)) {
    return DEFAULT_SYSTEM_CONFIG;
  }

  const rawFeatureFlags = isRecord(value.featureFlags) ? value.featureFlags : {};
  const rawModules = isRecord(value.modules) ? value.modules : {};
  const rawAttendanceRules = isRecord(value.attendanceRules) ? value.attendanceRules : {};
  const rawRollout = isRecord(value.rollout) ? value.rollout : {};

  return {
    version: 1,
    featureFlags: {
      attendance: rawFeatureFlags.attendance !== false,
      users: rawFeatureFlags.users !== false,
      storage: rawFeatureFlags.storage !== false,
      notifications: rawFeatureFlags.notifications !== false,
      email: rawFeatureFlags.email !== false,
      fileUploads: rawFeatureFlags.fileUploads !== false,
    },
    modules: {
      attendance: normalizeModuleConfig(rawModules.attendance, DEFAULT_SYSTEM_CONFIG.modules.attendance),
      users: normalizeModuleConfig(rawModules.users, DEFAULT_SYSTEM_CONFIG.modules.users),
      storage: normalizeModuleConfig(rawModules.storage, DEFAULT_SYSTEM_CONFIG.modules.storage),
      notifications: normalizeModuleConfig(rawModules.notifications, DEFAULT_SYSTEM_CONFIG.modules.notifications),
      email: normalizeModuleConfig(rawModules.email, DEFAULT_SYSTEM_CONFIG.modules.email),
      fileUploads: normalizeModuleConfig(rawModules.fileUploads, DEFAULT_SYSTEM_CONFIG.modules.fileUploads),
    },
    attendanceRules: {
      duplicateWindowMinutes:
        typeof rawAttendanceRules.duplicateWindowMinutes === "number" && Number.isFinite(rawAttendanceRules.duplicateWindowMinutes)
          ? Math.max(1, Math.floor(rawAttendanceRules.duplicateWindowMinutes))
          : DEFAULT_SYSTEM_CONFIG.attendanceRules.duplicateWindowMinutes,
      requireApproval: rawAttendanceRules.requireApproval !== false,
    },
    rollout: {
      compatibilityMode: rawRollout.compatibilityMode !== false,
    },
  };
}

export async function getSystemConfig(): Promise<CentralSystemConfig> {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, SYSTEM_CONFIG_ID)).limit(1);
  if (!rows.length) {
    return DEFAULT_SYSTEM_CONFIG;
  }

  return normalizeSystemConfig(rows[0].data);
}

export async function updateSystemConfig(input: CentralSystemConfig) {
  const normalized = normalizeSystemConfig(input);
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.id, SYSTEM_CONFIG_ID)).limit(1);
  if (existing.length > 0) {
    await db.update(settingsTable).set({ data: normalized, updatedAt: new Date() }).where(eq(settingsTable.id, SYSTEM_CONFIG_ID));
  } else {
    await db.insert(settingsTable).values({
      id: SYSTEM_CONFIG_ID,
      data: normalized,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  return normalized;
}

export async function isFeatureEnabled(feature: ManagedModuleKey) {
  const config = await getSystemConfig();
  return config.featureFlags[feature] !== false && config.modules[feature].enabled !== false;
}
