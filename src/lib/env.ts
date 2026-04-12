import "server-only";

const DEFAULT_PRODUCTION_URL = "https://astronomymvjce.vercel.app";

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeOrigin(value: string) {
  return new URL(normalizeUrl(value)).origin;
}

function getOptionalEnv(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

export function getAppBaseUrl() {
  const configuredUrl = getOptionalEnv("NEXTAUTH_URL");
  return normalizeUrl(configuredUrl ?? DEFAULT_PRODUCTION_URL);
}

export function getTrustedOrigins() {
  const candidates = [
    getAppBaseUrl(),
    getOptionalEnv("NEXT_PUBLIC_APP_URL"),
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter((value): value is string => Boolean(value));

  return [...new Set(candidates.map(normalizeOrigin))];
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

export { DEFAULT_PRODUCTION_URL };
