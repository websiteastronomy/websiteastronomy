"use server";

import { db } from "@/db";
import { settingsTable } from "@/db/schema";
import { SITE_SETTINGS_ID, normalizeSiteSettings } from "@/data/siteSettingsStatic";
import type { SiteSettings } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSystemAccess, requireAuthenticatedUser } from "@/lib/system-rbac";

async function requireAdminSiteSettingsAccess() {
  const user = await requireAuthenticatedUser();
  const access = await getSystemAccess(user.id);

  if (!access.isAdmin) {
    throw new Error("Forbidden");
  }

  return { user, access };
}

export async function getSiteSettingsAction(): Promise<SiteSettings> {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, SITE_SETTINGS_ID)).limit(1);
  return normalizeSiteSettings(rows[0]?.data);
}

export async function updateSiteSettingsAction(nextSettings: SiteSettings): Promise<SiteSettings> {
  await requireAdminSiteSettingsAccess();

  const normalized = normalizeSiteSettings(nextSettings);
  const existing = await db.select().from(settingsTable).where(eq(settingsTable.id, SITE_SETTINGS_ID)).limit(1);

  if (existing.length > 0) {
    await db
      .update(settingsTable)
      .set({ data: normalized, updatedAt: new Date() })
      .where(eq(settingsTable.id, SITE_SETTINGS_ID));
  } else {
    await db.insert(settingsTable).values({
      id: SITE_SETTINGS_ID,
      data: normalized,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  revalidatePath("/");
  revalidatePath("/join");
  revalidatePath("/about");
  revalidatePath("/education");
  revalidatePath("/admin");

  return normalized;
}
