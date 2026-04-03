"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function uploadProfileImageAction(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("File exceeds maximum allowed size of 2MB");
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG, and WebP files are allowed.");
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Date.now();
  const ext = file.name.match(/\.[^/.]+$/)?.[0] || ".jpg";
  const key = `users/${session.user.id}/profile-${timestamp}${ext}`;
  const bucket = process.env.R2_BUCKET_NAME || "";

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: file.type,
    ContentLength: file.size
  });

  await r2.send(command);

  const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;

  // Update DB directly here to universally sync picture logic in the native better-auth `image` field
  await db.update(users).set({ image: publicUrl, profileImageKey: key }).where(eq(users.id, session.user.id));

  return { success: true, key, url: publicUrl };
}
