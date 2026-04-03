"use server";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import sharp from "sharp";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export async function processAndUploadObservationImageAction(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  // 10MB limit enforcement
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("File exceeds maximum allowed size of 10MB");
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG, and WebP files are allowed.");
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Date.now();
  const baseKey = `observations/${session.user.id}/${timestamp}`;
  const bucket = process.env.R2_BUCKET_NAME || "";
  const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

  // 1. Process Original (Strip metadata, fix rotation, keep original format/quality essentially but purified)
  const originalProcessed = await sharp(fileBuffer)
    .rotate() // auto-rotate based on EXIF before stripping
    .toBuffer();

  const ext = file.name.match(/\.[^/.]+$/)?.[0] || ".jpg";
  const originalKey = `${baseKey}/original${ext}`;

  await r2.send(new PutObjectCommand({
    Bucket: bucket,
    Key: originalKey,
    Body: originalProcessed,
    ContentType: file.type,
  }));

  // 2. Process Compressed WebP
  const compressedWebp = await sharp(fileBuffer)
    .rotate()
    .webp({ quality: 80, effort: 4 })
    .toBuffer();
    
  const compressedKey = `${baseKey}/compressed.webp`;

  await r2.send(new PutObjectCommand({
    Bucket: bucket,
    Key: compressedKey,
    Body: compressedWebp,
    ContentType: "image/webp",
  }));

  // 3. Process Thumbnail WebP
  const thumbWebp = await sharp(fileBuffer)
    .rotate()
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 70, effort: 4 })
    .toBuffer();
    
  const thumbKey = `${baseKey}/thumb.webp`;

  await r2.send(new PutObjectCommand({
    Bucket: bucket,
    Key: thumbKey,
    Body: thumbWebp,
    ContentType: "image/webp",
  }));

  return { 
    success: true, 
    urls: {
      original: `${r2Base}/${originalKey}`,
      compressed: `${r2Base}/${compressedKey}`,
      thumbnail: `${r2Base}/${thumbKey}`,
    }
  };
}
