"use server";

import { db } from "@/db";
import { observations, observation_versions, observation_reports, users } from "@/db/schema";
import { eq, or, and, arrayContains, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { hasPermission } from "@/lib/permissions";

// ==========================================
// 1. SUBMIT & EDIT (MEMBER ACTIONS)
// ==========================================

export async function submitObservationAction(data: any, isDraft: boolean) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const id = uuidv4();
  await db.insert(observations).values({
    id,
    observerId: session.user.id,
    status: isDraft ? "Draft" : "Submitted",
    title: data.title,
    category: data.category,
    celestialTarget: data.celestialTarget,
    description: data.description,
    location: data.location,
    capturedAt: new Date(data.capturedAt),
    
    imageOriginalUrl: data.imageOriginalUrl,
    imageCompressedUrl: data.imageCompressedUrl,
    imageThumbnailUrl: data.imageThumbnailUrl,

    equipment: data.equipment || null,
    exposureTime: data.exposureTime || null,
    iso: data.iso || null,
    focalLength: data.focalLength || null,
    filtersUsed: data.filtersUsed || null,
    bortleScale: data.bortleScale || null,
    framesCount: data.framesCount ? parseInt(data.framesCount) : null,
    processingSoftware: data.processingSoftware || null,
    
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/portal/observations");
  return { success: true, id };
}

export async function editObservationAction(id: string, data: any, isDraft: boolean) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const [obs] = await db.select().from(observations).where(eq(observations.id, id));
  if (!obs) throw new Error("Observation not found");
  
  // Only owner or admin can edit
  const isAdmin = await hasPermission(session.user.id, "manage_projects"); // Assuming generic admin power
  if (obs.observerId !== session.user.id && !isAdmin) {
    throw new Error("Forbidden: Not your observation");
  }

  // Record Version History
  await db.insert(observation_versions).values({
    id: uuidv4(),
    observationId: id,
    versionNumber: obs.versionNumber,
    editedBy: session.user.id,
    changes: obs, // Store previous state
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Update Observation & Reset Workflow
  await db.update(observations)
    .set({
      status: isDraft ? "Draft" : "Submitted",
      versionNumber: obs.versionNumber + 1,
      approvals: [],
      rejections: [],
      adminDecision: null,
      rejectionReason: null,

      title: data.title,
      category: data.category,
      celestialTarget: data.celestialTarget,
      description: data.description,
      location: data.location,
      capturedAt: new Date(data.capturedAt),
      
      imageOriginalUrl: data.imageOriginalUrl || obs.imageOriginalUrl,
      imageCompressedUrl: data.imageCompressedUrl || obs.imageCompressedUrl,
      imageThumbnailUrl: data.imageThumbnailUrl || obs.imageThumbnailUrl,

      equipment: data.equipment,
      exposureTime: data.exposureTime,
      iso: data.iso,
      focalLength: data.focalLength,
      filtersUsed: data.filtersUsed,
      bortleScale: data.bortleScale,
      framesCount: data.framesCount ? parseInt(data.framesCount) : null,
      processingSoftware: data.processingSoftware,
      
      updatedAt: new Date(),
    })
    .where(eq(observations.id, id));

  revalidatePath("/portal/observations");
  if (isAdmin) revalidatePath("/admin");
  return { success: true };
}

// ==========================================
// 2. CORE OVERSIGHT
// ==========================================

export async function processCoreVoteAction(id: string, vote: "approve" | "reject", reason?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  // Validate user is Core (in actual system, verify role using DB join on roles)
  const isCore = await hasPermission(session.user.id, "manage_projects"); // Simplified proxy for Core permission
  if (!isCore) throw new Error("Forbidden: Core permission required");

  const [obs] = await db.select().from(observations).where(eq(observations.id, id));
  if (!obs) throw new Error("Observation not found");

  if (obs.status !== "Submitted" && obs.status !== "Under_Review") {
    throw new Error(`Cannot vote on observation in status: ${obs.status}`);
  }

  const approvals = [...(obs.approvals as string[])];
  const rejections = [...(obs.rejections as string[])];

  if (vote === "approve" && !approvals.includes(session.user.id)) {
    approvals.push(session.user.id);
    // Remove from rejections if they changed their mind
    const idx = rejections.indexOf(session.user.id);
    if (idx > -1) rejections.splice(idx, 1);
  } else if (vote === "reject" && !rejections.includes(session.user.id)) {
    rejections.push(session.user.id);
    const idx = approvals.indexOf(session.user.id);
    if (idx > -1) approvals.splice(idx, 1);
  }

  // Evaluate state advancement (2 required)
  let newStatus: string = obs.status === "Submitted" ? "Under_Review" : obs.status;
  let rejectionReasonStr = obs.rejectionReason;

  if (approvals.length >= 2) {
    newStatus = "Core_Approved";
  } else if (rejections.length >= 2) {
    newStatus = "Rejected";
    rejectionReasonStr = reason || "Declined by Core review consensus.";
  }

  await db.update(observations)
    .set({
      approvals,
      rejections,
      status: newStatus as any,
      rejectionReason: rejectionReasonStr,
      updatedAt: new Date(),
    })
    .where(eq(observations.id, id));

  revalidatePath("/core/observations");
  return { success: true, status: newStatus };
}

// ==========================================
// 3. ADMIN PUBLISHING
// ==========================================

export async function adminFinalizeObservationAction(id: string, decision: "approve" | "reject", reason?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const isAdmin = await hasPermission(session.user.id, "delete_records"); // Proxy for Super Admin
  if (!isAdmin) throw new Error("Forbidden: Admin required");

  const newStatus = decision === "approve" ? "Published" : "Rejected";

  await db.update(observations)
    .set({
      status: newStatus as any,
      adminDecision: decision,
      rejectionReason: decision === "reject" ? reason : null,
      updatedAt: new Date()
    })
    .where(eq(observations.id, id));

  revalidatePath("/admin");
  revalidatePath("/observations");
  return { success: true };
}

// ==========================================
// 4. GETTERS
// ==========================================

export async function getMyObservationsAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];
  return await db.select().from(observations).where(eq(observations.observerId, session.user.id)).orderBy(desc(observations.createdAt));
}

export async function getAllObservationsForAdminAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];
  const isAdmin = await hasPermission(session.user.id, "delete_records");
  if (!isAdmin) return [];
  
  return await db.select().from(observations).orderBy(desc(observations.createdAt));
}

export async function getPublishedObservationsAction() {
  return await db.select().from(observations).where(eq(observations.status, "Published")).orderBy(desc(observations.capturedAt));
}

export async function getSingleObservationAction(id: string) {
  const [obs] = await db.select().from(observations).where(eq(observations.id, id));
  if (!obs) return null;
  // Let's strip sensitive info if needed, but observations are public.
  return obs;
}

export async function reportObservationAction(id: string, reason: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  
  const [obs] = await db.select().from(observations).where(eq(observations.id, id));
  if (!obs) throw new Error("Observation not found");

  const reportId = uuidv4();
  await db.insert(observation_reports).values({
    id: reportId,
    observationId: id,
    reporterId: session?.user?.id || null,
    reason,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const newReportCount = obs.reportsCount + 1;
  const threshold = 3; 

  await db.update(observations)
    .set({
      reportsCount: newReportCount,
      status: newReportCount >= threshold ? "Under_Review" : obs.status,
      updatedAt: new Date(),
    })
    .where(eq(observations.id, id));

  revalidatePath("/observations");
  revalidatePath(`/observations/${id}`);
  return { success: true, flagged: newReportCount >= threshold };
}
