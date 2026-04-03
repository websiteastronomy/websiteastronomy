export type SystemFeatureFlags = {
  quizzesEnabled: boolean;
  observationsEnabled: boolean;
  eventsEnabled: boolean;
};

export type SystemControlSettings = {
  maintenanceEnabled: boolean;
  maintenanceUntil: string | null;
  maintenanceReason: string | null;
  lockdownEnabled: boolean;
  lockdownReason: string | null;
  features: SystemFeatureFlags;
};

export const DEFAULT_SYSTEM_CONTROL_SETTINGS: SystemControlSettings = {
  maintenanceEnabled: false,
  maintenanceUntil: null,
  maintenanceReason: null,
  lockdownEnabled: false,
  lockdownReason: null,
  features: {
    quizzesEnabled: true,
    observationsEnabled: true,
    eventsEnabled: true,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toIsoOrNull(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function normalizeSystemControlSettings(value: unknown): SystemControlSettings {
  if (!isRecord(value)) {
    return DEFAULT_SYSTEM_CONTROL_SETTINGS;
  }

  const features = isRecord(value.features) ? value.features : {};

  return {
    maintenanceEnabled: value.maintenanceEnabled === true,
    maintenanceUntil: toIsoOrNull(value.maintenanceUntil),
    maintenanceReason: typeof value.maintenanceReason === "string" ? value.maintenanceReason : null,
    lockdownEnabled: value.lockdownEnabled === true,
    lockdownReason: typeof value.lockdownReason === "string" ? value.lockdownReason : null,
    features: {
      quizzesEnabled: features.quizzesEnabled !== false,
      observationsEnabled: features.observationsEnabled !== false,
      eventsEnabled: features.eventsEnabled !== false,
    },
  };
}

export function isFeatureDisabled(settings: SystemControlSettings, feature: keyof SystemFeatureFlags) {
  return settings.features[feature] === false;
}

export function isMaintenanceActive(settings: SystemControlSettings, now = new Date()) {
  if (!settings.maintenanceEnabled) {
    return false;
  }

  if (!settings.maintenanceUntil) {
    return true;
  }

  const until = new Date(settings.maintenanceUntil);
  if (Number.isNaN(until.getTime())) {
    return true;
  }

  return until.getTime() > now.getTime();
}

export function getRestrictedFeatureForPath(pathname: string, settings: SystemControlSettings): keyof SystemFeatureFlags | null {
  if (pathname.startsWith("/education/quizzes") && !settings.features.quizzesEnabled) {
    return "quizzesEnabled";
  }
  if (pathname.startsWith("/observations") || pathname.startsWith("/portal/observations")) {
    if (!settings.features.observationsEnabled) {
      return "observationsEnabled";
    }
  }
  if (pathname.startsWith("/events")) {
    if (!settings.features.eventsEnabled) {
      return "eventsEnabled";
    }
  }
  return null;
}

export function getFeatureDisplayName(feature: keyof SystemFeatureFlags) {
  if (feature === "quizzesEnabled") return "Quizzes";
  if (feature === "observationsEnabled") return "Observations";
  return "Events";
}

export function getDisabledFeatureKeys(settings: SystemControlSettings): Array<keyof SystemFeatureFlags> {
  return (Object.keys(settings.features) as Array<keyof SystemFeatureFlags>).filter(
    (feature) => settings.features[feature] === false
  );
}
