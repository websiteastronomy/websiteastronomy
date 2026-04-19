import "server-only";

import {
  DeleteObjectCommand,
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  S3Client,
  type CORSRule,
} from "@aws-sdk/client-s3";
import { getTrustedOrigins } from "@/lib/env";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

let ensuredCorsPromise: Promise<void> | null = null;

function isCorsConfigAccessDenied(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const name = "name" in error ? String(error.name || "") : "";
  const message = "message" in error ? String(error.message || "") : "";
  const combined = `${name} ${message}`.toLowerCase();

  return (
    combined.includes("accessdenied") ||
    combined.includes("access denied") ||
    combined.includes("forbidden") ||
    combined.includes("not authorized") ||
    combined.includes("unauthorized")
  );
}

function buildExpectedCorsRule(): CORSRule {
  return {
    AllowedHeaders: ["*"],
    AllowedMethods: ["GET", "HEAD", "PUT", "POST", "DELETE"],
    AllowedOrigins: getTrustedOrigins(),
    ExposeHeaders: ["ETag"],
    MaxAgeSeconds: 3600,
  };
}

function corsRuleMatches(current: CORSRule | undefined, expected: CORSRule) {
  if (!current) return false;

  const sameList = (left?: string[], right?: string[]) => {
    const normalizedLeft = [...(left || [])].sort();
    const normalizedRight = [...(right || [])].sort();
    return normalizedLeft.length === normalizedRight.length &&
      normalizedLeft.every((value, index) => value === normalizedRight[index]);
  };

  return (
    sameList(current.AllowedHeaders, expected.AllowedHeaders) &&
    sameList(current.AllowedMethods, expected.AllowedMethods) &&
    sameList(current.AllowedOrigins, expected.AllowedOrigins) &&
    sameList(current.ExposeHeaders, expected.ExposeHeaders) &&
    (current.MaxAgeSeconds || 0) === (expected.MaxAgeSeconds || 0)
  );
}

export async function ensureR2UploadCors() {
  if (ensuredCorsPromise) {
    return ensuredCorsPromise;
  }

  ensuredCorsPromise = (async () => {
    const bucket = process.env.R2_BUCKET_NAME || "";
    if (!bucket) {
      throw new Error("R2_BUCKET_NAME is required for upload storage.");
    }

    const expectedRule = buildExpectedCorsRule();
    const current = await r2Client.send(new GetBucketCorsCommand({ Bucket: bucket })).catch((error) => {
      const code = typeof error === "object" && error && "name" in error ? String(error.name) : "";
      if (code === "NoSuchCORSConfiguration") {
        return { CORSRules: [] };
      }
      if (isCorsConfigAccessDenied(error)) {
        console.warn("[r2-storage] Skipping CORS inspection because the current R2 credentials cannot read bucket CORS settings.");
        return null;
      }
      throw error;
    });

    if (!current) {
      return;
    }

    const alreadyConfigured = (current.CORSRules || []).some((rule) => corsRuleMatches(rule, expectedRule));
    if (alreadyConfigured) {
      return;
    }

    await r2Client.send(
      new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: {
          CORSRules: [expectedRule],
        },
      })
    ).catch((error) => {
      if (isCorsConfigAccessDenied(error)) {
        console.warn("[r2-storage] Skipping CORS update because the current R2 credentials cannot modify bucket CORS settings.");
        return;
      }
      throw error;
    });
  })().catch((error) => {
    ensuredCorsPromise = null;
    throw error;
  });

  return ensuredCorsPromise;
}

export function getR2PublicBaseUrl() {
  return (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").replace(/\/+$/, "");
}

export function getR2PublicUrl(key: string) {
  return `${getR2PublicBaseUrl()}/${key}`;
}

export function extractR2KeyFromUrl(value: string | null | undefined) {
  if (!value) return null;

  const base = getR2PublicBaseUrl();
  if (!base) return null;

  if (value.startsWith(`${base}/`)) {
    return value.slice(base.length + 1);
  }

  return null;
}

export async function deleteR2Objects(keys: Array<string | null | undefined>) {
  const bucket = process.env.R2_BUCKET_NAME || "";
  const uniqueKeys = Array.from(new Set(keys.map((key) => key?.trim()).filter(Boolean) as string[]));

  await Promise.all(
    uniqueKeys.map((key) =>
      r2Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      )
    )
  );
}
