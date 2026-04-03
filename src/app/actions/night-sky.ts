"use server";

import { db } from "@/db";
import { settingsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSystemAccess, requireAuthenticatedUser } from "@/lib/system-rbac";
import {
  fetchNightSkyAutomaticData,
  getNightSkyStructuredSettings,
  normalizeNightSkySystemState,
  resolveNightSkySystemData,
} from "@/lib/night-sky";
import type { SiteSettings } from "@/lib/db";

const NIGHT_SKY_SETTINGS_ID = "night_sky_system";

async function requireNightSkyManager() {
  const user = await requireAuthenticatedUser();
  const access = await getSystemAccess(user.id);
  if (!(access.isAdmin || access.canApproveActions)) {
    throw new Error("Forbidden");
  }
  return { user, access };
}

async function readNightSkySystemRecord() {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, NIGHT_SKY_SETTINGS_ID)).limit(1);
  return rows[0] || null;
}

export async function refreshNightSkyAutoDataInternal() {
  const existingRecord = await readNightSkySystemRecord();
  const existing = normalizeNightSkySystemState(existingRecord?.data);

  try {
    const { data, source } = await fetchNightSkyAutomaticData();
    const nextData = {
      ...existing,
      apiData: data,
      lastSavedData: data,
      apiFetchedAt: new Date().toISOString(),
      apiStatus: "success" as const,
      apiSource: source,
      lastUpdated: new Date().toISOString(),
    };

    if (existingRecord) {
      await db.update(settingsTable).set({ data: nextData, updatedAt: new Date() }).where(eq(settingsTable.id, NIGHT_SKY_SETTINGS_ID));
    } else {
      await db.insert(settingsTable).values({ id: NIGHT_SKY_SETTINGS_ID, data: nextData, createdAt: new Date(), updatedAt: new Date() });
    }

    revalidatePath("/night-sky");
    revalidatePath("/admin");
    return nextData;
  } catch (error) {
    const nextData = {
      ...existing,
      apiStatus: "error" as const,
      lastUpdated: new Date().toISOString(),
    };

    if (existingRecord) {
      await db.update(settingsTable).set({ data: nextData, updatedAt: new Date() }).where(eq(settingsTable.id, NIGHT_SKY_SETTINGS_ID));
    }

    throw error;
  }
}

export async function getNightSkySystemSettingsAction() {
  const record = await readNightSkySystemRecord();
  return normalizeNightSkySystemState(record?.data);
}

export async function syncNightSkyAdminDataAction(siteSettings: SiteSettings) {
  await requireNightSkyManager();
  const existing = normalizeNightSkySystemState((await readNightSkySystemRecord())?.data);
  const adminData = getNightSkyStructuredSettings(siteSettings);
  const nextData = {
    ...existing,
    isEnabled: adminData.isEnabled,
    mode: adminData.mode,
    lastUpdated: new Date().toISOString(),
    adminData,
    lastSavedData: existing.lastSavedData ?? {
      moon: adminData.moon,
      planets: adminData.planets,
      upcomingEvents: adminData.upcomingEvents,
    },
  };

  const existingRecord = await readNightSkySystemRecord();
  if (existingRecord) {
    await db.update(settingsTable).set({ data: nextData, updatedAt: new Date() }).where(eq(settingsTable.id, NIGHT_SKY_SETTINGS_ID));
  } else {
    await db.insert(settingsTable).values({ id: NIGHT_SKY_SETTINGS_ID, data: nextData, createdAt: new Date(), updatedAt: new Date() });
  }

  revalidatePath("/admin");
  return nextData;
}

export async function refreshNightSkyAutoDataAction() {
  await requireNightSkyManager();
  return refreshNightSkyAutoDataInternal();
}

export async function getResolvedNightSkyDataAction() {
  const state = await getNightSkySystemSettingsAction();
  return resolveNightSkySystemData(state);
}
