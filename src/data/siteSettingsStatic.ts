import type { SiteSettings } from "@/lib/db";
import { readSiteSettingsLocal } from "@/lib/settingsLocal";
import { MOCK_NIGHT_SKY } from "./mockNightSky";
import { normalizeNightSkySettings } from "@/lib/night-sky";

/** Default site-wide config (no Firestore). */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  id: "global_config",
  isRecruiting: true,
  heroStats: { members: 120, projects: 8, events: 50, impact: 1000 },
  dailyFact: { text: "The universe is expanding.", source: "NASA" },
  featuredProjectId: "",
  featuredEventId: "",
  nightSky: {
    ...MOCK_NIGHT_SKY,
    isEnabled: true,
    mode: "manual",
    lastUpdated: null,
  },
  nightSkyStructured: {
    ...MOCK_NIGHT_SKY,
    isEnabled: true,
    mode: "manual",
    lastUpdated: null,
  },
};

/** Defaults merged with `localStorage` (written from admin Save). */
export function loadSiteSettingsClient(): SiteSettings {
  const local = readSiteSettingsLocal();
  if (!local) return DEFAULT_SITE_SETTINGS;
  const h = local.heroStats;
  const d = local.dailyFact;
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...local,
    heroStats: {
      ...DEFAULT_SITE_SETTINGS.heroStats,
      ...(h && typeof h === "object" && !Array.isArray(h) ? (h as SiteSettings["heroStats"]) : {}),
    },
    dailyFact: {
      ...DEFAULT_SITE_SETTINGS.dailyFact,
      ...(d && typeof d === "object" && !Array.isArray(d) ? (d as SiteSettings["dailyFact"]) : {}),
    },
    featuredProjectId:
      typeof local.featuredProjectId === "string"
        ? local.featuredProjectId
        : DEFAULT_SITE_SETTINGS.featuredProjectId,
    featuredEventId:
      typeof local.featuredEventId === "string"
        ? local.featuredEventId
        : DEFAULT_SITE_SETTINGS.featuredEventId,
    nightSky: normalizeNightSkySettings(local.nightSky),
    nightSkyStructured: normalizeNightSkySettings(local.nightSkyStructured),
  };
}
