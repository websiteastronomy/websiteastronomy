import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

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
