import { MOCK_NIGHT_SKY, NightSkyLegacyData, NightSkySettings } from "@/data/mockNightSky";
import type { SiteSettings } from "@/lib/db";

const DEFAULT_NIGHT_SKY_SETTINGS: NightSkySettings = {
  ...MOCK_NIGHT_SKY,
  isEnabled: true,
  mode: "manual",
  lastUpdated: null,
};

export type NightSkyAutoSource = "api" | "generated" | "stored";

export interface NightSkySystemState {
  isEnabled: boolean;
  mode: "auto" | "hybrid" | "manual";
  lastUpdated: string | null;
  adminData: NightSkySettings;
  apiData: NightSkyLegacyData | null;
  lastSavedData: NightSkyLegacyData | null;
  apiFetchedAt: string | null;
  apiStatus: "idle" | "success" | "error";
  apiSource: NightSkyAutoSource | null;
}

const DEFAULT_NIGHT_SKY_SYSTEM_STATE: NightSkySystemState = {
  isEnabled: true,
  mode: "manual",
  lastUpdated: null,
  adminData: DEFAULT_NIGHT_SKY_SETTINGS,
  apiData: null,
  lastSavedData: MOCK_NIGHT_SKY,
  apiFetchedAt: null,
  apiStatus: "idle",
  apiSource: null,
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeNightSkyLegacyData(value: unknown): NightSkyLegacyData {
  const settings = normalizeNightSkySettings(value);
  return {
    moon: settings.moon,
    planets: settings.planets,
    upcomingEvents: settings.upcomingEvents,
  };
}

export function normalizeNightSkySettings(value: unknown): NightSkySettings {
  if (!isObjectRecord(value)) {
    return DEFAULT_NIGHT_SKY_SETTINGS;
  }

  return {
    ...DEFAULT_NIGHT_SKY_SETTINGS,
    ...value,
    moon: isObjectRecord(value.moon)
      ? { ...DEFAULT_NIGHT_SKY_SETTINGS.moon, ...value.moon }
      : DEFAULT_NIGHT_SKY_SETTINGS.moon,
    planets: Array.isArray(value.planets) ? value.planets : DEFAULT_NIGHT_SKY_SETTINGS.planets,
    upcomingEvents: Array.isArray(value.upcomingEvents) ? value.upcomingEvents : DEFAULT_NIGHT_SKY_SETTINGS.upcomingEvents,
    isEnabled: value.isEnabled !== undefined ? Boolean(value.isEnabled) : DEFAULT_NIGHT_SKY_SETTINGS.isEnabled,
    mode: value.mode === "auto" || value.mode === "hybrid" || value.mode === "manual" ? value.mode : DEFAULT_NIGHT_SKY_SETTINGS.mode,
    lastUpdated: typeof value.lastUpdated === "string" ? value.lastUpdated : DEFAULT_NIGHT_SKY_SETTINGS.lastUpdated,
  };
}

export function getNightSkySettings(siteSettings?: SiteSettings | null): NightSkySettings {
  return normalizeNightSkySettings(siteSettings?.nightSky);
}

export function getNightSkyStructuredSettings(siteSettings?: SiteSettings | null): NightSkySettings {
  return normalizeNightSkySettings(siteSettings?.nightSkyStructured ?? siteSettings?.nightSky);
}

export function getNightSkyData(siteSettings?: SiteSettings | null): NightSkyLegacyData | null {
  const settings = getNightSkySettings(siteSettings);
  if (!settings.isEnabled) {
    return null;
  }

  return {
    moon: settings.moon,
    planets: settings.planets,
    upcomingEvents: settings.upcomingEvents,
  };
}

export function normalizeNightSkySystemState(value: unknown): NightSkySystemState {
  if (!isObjectRecord(value)) {
    return DEFAULT_NIGHT_SKY_SYSTEM_STATE;
  }

  return {
    isEnabled: value.isEnabled !== undefined ? Boolean(value.isEnabled) : DEFAULT_NIGHT_SKY_SYSTEM_STATE.isEnabled,
    mode: value.mode === "auto" || value.mode === "hybrid" || value.mode === "manual" ? value.mode : DEFAULT_NIGHT_SKY_SYSTEM_STATE.mode,
    lastUpdated: typeof value.lastUpdated === "string" ? value.lastUpdated : DEFAULT_NIGHT_SKY_SYSTEM_STATE.lastUpdated,
    adminData: normalizeNightSkySettings(value.adminData),
    apiData: value.apiData ? normalizeNightSkyLegacyData(value.apiData) : null,
    lastSavedData: value.lastSavedData ? normalizeNightSkyLegacyData(value.lastSavedData) : DEFAULT_NIGHT_SKY_SYSTEM_STATE.lastSavedData,
    apiFetchedAt: typeof value.apiFetchedAt === "string" ? value.apiFetchedAt : DEFAULT_NIGHT_SKY_SYSTEM_STATE.apiFetchedAt,
    apiStatus: value.apiStatus === "success" || value.apiStatus === "error" || value.apiStatus === "idle" ? value.apiStatus : DEFAULT_NIGHT_SKY_SYSTEM_STATE.apiStatus,
    apiSource: value.apiSource === "api" || value.apiSource === "generated" || value.apiSource === "stored" ? value.apiSource : DEFAULT_NIGHT_SKY_SYSTEM_STATE.apiSource,
  };
}

function mergeNightSkyData(base: NightSkyLegacyData, overrides: NightSkyLegacyData): NightSkyLegacyData {
  return {
    moon: { ...base.moon, ...overrides.moon },
    planets: overrides.planets?.length ? overrides.planets : base.planets,
    upcomingEvents: overrides.upcomingEvents?.length ? overrides.upcomingEvents : base.upcomingEvents,
  };
}

export function resolveNightSkySystemData(state: NightSkySystemState): NightSkyLegacyData | null {
  if (!state.isEnabled) {
    return null;
  }

  const adminData = normalizeNightSkyLegacyData(state.adminData);
  const apiData = state.apiData ? normalizeNightSkyLegacyData(state.apiData) : null;
  const lastSavedData = state.lastSavedData ? normalizeNightSkyLegacyData(state.lastSavedData) : MOCK_NIGHT_SKY;

  if (state.mode === "auto") {
    return apiData ?? lastSavedData ?? adminData;
  }

  if (state.mode === "hybrid") {
    return apiData ? mergeNightSkyData(apiData, adminData) : lastSavedData ?? adminData;
  }

  return adminData;
}

function calculateMoonPhase(now: Date) {
  const synodicMonth = 29.53058867;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const daysSinceKnownNewMoon = (now.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24);
  const currentCycleDay = ((daysSinceKnownNewMoon % synodicMonth) + synodicMonth) % synodicMonth;
  const illumination = Math.round(((1 - Math.cos((2 * Math.PI * currentCycleDay) / synodicMonth)) / 2) * 100);
  const daysUntilFull = Math.round((14.765 - currentCycleDay + synodicMonth) % synodicMonth);

  let phase = "New Moon";
  if (currentCycleDay > 1.84566 && currentCycleDay <= 5.53699) phase = "Waxing Crescent";
  else if (currentCycleDay <= 9.22831) phase = "First Quarter";
  else if (currentCycleDay <= 12.91963) phase = "Waxing Gibbous";
  else if (currentCycleDay <= 16.61096) phase = "Full Moon";
  else if (currentCycleDay <= 20.30228) phase = "Waning Gibbous";
  else if (currentCycleDay <= 23.99361) phase = "Last Quarter";
  else if (currentCycleDay <= 27.68493) phase = "Waning Crescent";

  return { phase, illumination, daysUntilFull };
}

export function generateNightSkyApproximation(now = new Date()): NightSkyLegacyData {
  const moon = calculateMoonPhase(now);

  return {
    moon: {
      ...MOCK_NIGHT_SKY.moon,
      phase: moon.phase,
      illumination: moon.illumination,
      daysUntilFull: moon.daysUntilFull,
    },
    planets: MOCK_NIGHT_SKY.planets.map((planet, index) => ({
      ...planet,
      riseTime: `${String((18 + index * 2) % 24).padStart(2, "0")}:00`,
      setTime: `${String((6 + index * 3) % 24).padStart(2, "0")}:30`,
      isNakedEyeVisible: index < 4,
    })),
    upcomingEvents: MOCK_NIGHT_SKY.upcomingEvents,
  };
}

export async function fetchNightSkyAutomaticData(): Promise<{ data: NightSkyLegacyData; source: NightSkyAutoSource }> {
  const providerUrl = process.env.NIGHT_SKY_API_URL;
  if (providerUrl) {
    const response = await fetch(providerUrl, { next: { revalidate: 0 } });
    if (!response.ok) {
      throw new Error(`Night Sky provider request failed with status ${response.status}.`);
    }

    const payload = await response.json();
    return {
      data: normalizeNightSkyLegacyData(payload),
      source: "api",
    };
  }

  return {
    data: generateNightSkyApproximation(),
    source: "generated",
  };
}
