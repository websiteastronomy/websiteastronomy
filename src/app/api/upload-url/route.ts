import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { assertProjectPermission } from "@/lib/project_permissions";
import { getFinanceAccess } from "@/lib/finance";
import { ensureR2UploadCors, r2Client } from "@/lib/r2-storage";
import { getSystemAccess } from "@/lib/system-rbac";
import { buildUploadPlan, validateUploadAgainstRules } from "@/lib/storage-upload";
import type { UploadIntent } from "@/lib/storage-upload.shared";
import { isFeatureEnabled } from "@/lib/system-modules";

async function assertUploadPermission(userId: string, intent: UploadIntent) {
  const access = await getSystemAccess(userId);

  if (intent.category === "projects" && !access.canManageProjects) {
    throw new Error("Unauthorized: Project upload access required");
  }

  if (intent.category === "events" && !access.canManageEvents) {
    throw new Error("Unauthorized: Event upload access required");
  }

  if ((intent.category === "media" || intent.category === "general") && !access.isAdmin) {
    throw new Error("Unauthorized: Admin upload access required");
  }

  if ((intent.category === "outreach_images" || intent.category === "achievement_images") && !access.isAdmin) {
    throw new Error("Unauthorized: Admin upload access required");
  }

  if (intent.category === "quizzes" && !access.isAdmin && !access.canApproveActions) {
    throw new Error("Unauthorized: Quiz upload access required");
  }

  if (intent.category === "documentation") {
    if (intent.isGlobal) {
      if (!(access.isAdmin || access.canManageProjects || access.canApproveActions)) {
        throw new Error("Unauthorized: Documentation upload access required");
      }
    } else if (intent.projectId) {
      await assertProjectPermission(intent.projectId, userId, "canUpload");
    } else {
      throw new Error("A projectId is required for non-global documentation uploads.");
    }
  }

  if (intent.category === "forms" && intent.projectId) {
    await assertProjectPermission(intent.projectId, userId, "canUpload");
  }

  if (intent.category === "finance_receipts") {
    const financeAccess = await getFinanceAccess(userId);
    if (!financeAccess.canSubmitExpenses) {
      throw new Error("Unauthorized: Finance receipt upload access required");
    }
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isFeatureEnabled("fileUploads"))) {
      return NextResponse.json({ error: "File uploads are currently disabled" }, { status: 503 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRes = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    if (!userRes.length) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const intent: UploadIntent = {
      category: body.category || "general",
      fileName: body.fileName || "",
      fileType: body.fileType || "application/octet-stream",
      fileSize: Number(body.fileSize) || 0,
      entityId: body.entityId || null,
      projectId: body.projectId || null,
      isGlobal: Boolean(body.isGlobal),
      isPublic: body.isPublic ?? true,
    };

    if (!intent.fileName || intent.fileSize <= 0) {
      return NextResponse.json({ error: "Missing file metadata" }, { status: 400 });
    }

    await assertUploadPermission(session.user.id, intent);
    await validateUploadAgainstRules(intent);
    await ensureR2UploadCors();
    const uploadPlan = await buildUploadPlan(session.user.id, intent);

    const bucket = process.env.R2_BUCKET_NAME || "";
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: uploadPlan.key,
      ContentType: intent.fileType || "application/octet-stream",
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });

    return NextResponse.json({
      uploadUrl,
      fileKey: uploadPlan.key,
      fileName: uploadPlan.finalFileName,
      fileUrl: uploadPlan.publicUrl,
    });
  } catch (error) {
    console.error("[upload-url] failed:", error);
    const message = error instanceof Error ? error.message : "Failed to generate upload URL";
    const status =
      message.startsWith("Unauthorized")
        ? 403
        : message.startsWith("File too large") || message.startsWith("Unsupported file type") || message.includes("Missing file metadata")
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
