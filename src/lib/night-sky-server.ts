import { db } from "@/db";
import { settingsTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { normalizeNightSkySystemState, resolveNightSkySystemData } from "@/lib/night-sky";

const NIGHT_SKY_SETTINGS_ID = "night_sky_system";

export async function getNightSkyResolvedState() {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.id, NIGHT_SKY_SETTINGS_ID)).limit(1);
  const state = normalizeNightSkySystemState(rows[0]?.data);
  const data = resolveNightSkySystemData(state);
  return { state, data };
}
