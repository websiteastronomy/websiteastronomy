
const KEY_SITE = "astronomy_club_site_settings_v1";
const KEY_ABOUT = "astronomy_club_about_settings_v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readSiteSettingsLocal(): Record<string, unknown> | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(KEY_SITE);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function writeSiteSettingsLocal(data: Record<string, unknown>): void {
  if (!canUseStorage()) return;
  try {
    const prev = readSiteSettingsLocal() || {};
    const merged: Record<string, unknown> = {
      ...prev,
      ...data,
      heroStats: data.heroStats
        ? { ...asRecord(prev.heroStats), ...asRecord(data.heroStats) }
        : prev.heroStats,
      dailyFact: data.dailyFact
        ? { ...asRecord(prev.dailyFact), ...asRecord(data.dailyFact) }
        : prev.dailyFact,
    };
    localStorage.setItem(KEY_SITE, JSON.stringify(merged));
  } catch (e) {
    console.warn("[settingsLocal] Failed to write site settings:", e);
  }
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function readAboutSettingsLocal(): Record<string, unknown> | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(KEY_ABOUT);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function writeAboutSettingsLocal(data: Record<string, unknown>): void {
  if (!canUseStorage()) return;
  try {
    const prev = readAboutSettingsLocal() || {};
    const merged: Record<string, unknown> = {
      ...prev,
      ...data,
      vision: data.vision
        ? { ...asRecord(prev.vision), ...asRecord(data.vision) }
        : prev.vision,
      mission: data.mission
        ? { ...asRecord(prev.mission), ...asRecord(data.mission) }
        : prev.mission,
    };
    localStorage.setItem(KEY_ABOUT, JSON.stringify(merged));
  } catch (e) {
    console.warn("[settingsLocal] Failed to write about settings:", e);
  }
}

/** Firestore rejects `undefined` anywhere in the payload. */
export function stripUndefinedDeep(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep).filter((v) => v !== undefined);
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as object)) {
    if (v === undefined) continue;
    const sv = stripUndefinedDeep(v);
    if (sv !== undefined) out[k] = sv;
  }
  return out;
}
