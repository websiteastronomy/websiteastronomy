import "server-only";

import { getAppBaseUrl, getTrustedOrigins, DEFAULT_PRODUCTION_URL } from "@/lib/env.shared";

function getOptionalEnv(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

export function getRequiredServerEnv(name: string) {
  const value = getOptionalEnv(name);
  if (!value) {
    throw new Error(`${name} is required for server runtime.`);
  }

  return value;
}

export function getDatabaseUrl() {
  return getRequiredServerEnv("DATABASE_URL");
}

export function getBetterAuthSecret() {
  return getRequiredServerEnv("BETTER_AUTH_SECRET");
}

export { DEFAULT_PRODUCTION_URL, getAppBaseUrl, getTrustedOrigins };
