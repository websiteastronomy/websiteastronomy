"use server";

import { db } from "@/db";
import { observations, observation_versions, observation_reports, users } from "@/db/schema";
import { eq, desc, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { getUserProfile, hasPermission } from "@/lib/permissions";
import {
  createNotificationForUser,
  createNotificationsForUsers,
} from "@/app/actions/notifications";

const REVIEWER_COUNT = 3;

async function getAssignedReviewerIds(observerId: string) {
  const allUsers = await db.select({ id: users.id }).from(users);
  const reviewerFlags = await Promise.all(
    allUsers.map(async (user) => ({
      id: user.id,
      canReview:
        user.id !== observerId && (await hasPermission(user.id, "manage_projects")),
    }))
  );

  return reviewerFlags
    .filter((reviewer) => reviewer.canReview)
    .slice(0, REVIEWER_COUNT)
    .map((reviewer) => reviewer.id);
}

async function getAdminUserIds() {
  const allUsers = await db.select({ id: users.id }).from(users);
  const adminFlags = await Promise.all(
    allUsers.map(async (user) => ({
      id: user.id,
      isAdmin:
        (await getUserProfile(user.id))?.normalizedRole === "Admin" ||
        (await hasPermission(user.id, "delete_files")),
    }))
  );

  return adminFlags.filter((user) => user.isAdmin).map((user) => user.id);
}

async function notifyObservationSubmitted(params: {
  observationId: string;
  title: string;
  observerName: string;
  assignedReviewerIds: string[];
}) {
  const adminUserIds = await getAdminUserIds();
  const reviewerNotifications = params.assignedReviewerIds.map((reviewerId) => ({
    userId: reviewerId,
    type: "system" as const,
    title: "Observation Assigned for Review",
    message: `${params.observerName} submitted "${params.title}" for your core review.`,
    link: "/core/observations",
  }));
  const adminNotifications = adminUserIds.map((adminId) => ({
    userId: adminId,
    type: "system" as const,
    title: "New Observation Submitted",
    message: `"${params.title}" entered moderation and is now under review.`,
    link: "/admin",
  }));

  await createNotificationsForUsers(
    [...reviewerNotifications, ...adminNotifications].filter(
      (notification, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.userId === notification.userId &&
            candidate.title === notification.title &&
            candidate.link === notification.link
        ) === index
    )
  );
}

async function notifyAdminCoreApproved(params: {
  observationId: string;
  title: string;
}) {
  const adminUserIds = await getAdminUserIds();
  await createNotificationsForUsers(
    adminUserIds.map((adminId) => ({
      userId: adminId,
      type: "system",
      title: "Observation Ready for Publish",
      message: `"${params.title}" has passed core review and is ready for admin moderation.`,
      link: "/admin",
    }))
  );
}

async function notifyObserverDecision(params: {
  observerId: string;
  title: string;
  decision: "approve" | "reject";
  reason?: string | null;
}) {
  const message =
    params.decision === "approve"
      ? `Your observation "${params.title}" was approved and published.`
      : `Your observation "${params.title}" was rejected.${params.reason ? ` Reason: ${params.reason}` : ""}`;

  await createNotificationForUser({
    userId: params.observerId,
    type: "system",
    title:
      params.decision === "approve"
        ? "Observation Published"
        : "Observation Rejected",
    message,
    link: "/portal/observations",
  });
}

async function buildReviewWorkflowState({
  observerId,
  existingAssignedReviewers,
  isDraft,
}: {
  observerId: string;
  existingAssignedReviewers?: unknown;
  isDraft: boolean;
}) {
  if (isDraft) {
    return {
      status: "Draft" as const,
      assignedReviewers: Array.isArray(existingAssignedReviewers)
        ? (existingAssignedReviewers as string[])
        : [],
      submittedAt: null,
    };
  }

  const preservedReviewers = Array.isArray(existingAssignedReviewers)
    ? (existingAssignedReviewers as string[]).filter(Boolean)
    : [];
  const assignedReviewers =
    preservedReviewers.length > 0
      ? preservedReviewers
      : await getAssignedReviewerIds(observerId);
  const submittedAt = new Date();

  return {
    status: "Under_Review" as const,
    assignedReviewers,
    submittedAt,
  };
}

// ==========================================
// 1. SUBMIT & EDIT (MEMBER ACTIONS)
// ==========================================

export async function submitObservationAction(data: any, isDraft: boolean) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const id = uuidv4();
  const workflow = await buildReviewWorkflowState({
    observerId: session.user.id,
    isDraft,
  });
  const now = workflow.submittedAt ?? new Date();

  await db.insert(observations).values({
    id,
    observerId: session.user.id,
    status: workflow.status,
    assignedReviewers: workflow.assignedReviewers,
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
    
    createdAt: now,
    updatedAt: now,
  });

  console.log("[observations] submitObservationAction", {
    id,
    observerId: session.user.id,
    status: workflow.status,
    assignedReviewers: workflow.assignedReviewers,
    submittedAt: workflow.submittedAt?.toISOString() ?? null,
  });

  if (!isDraft) {
    await notifyObservationSubmitted({
      observationId: id,
      title: data.title,
      observerName: session.user.name || "A member",
      assignedReviewerIds: workflow.assignedReviewers,
    });
  }

  revalidatePath("/portal/observations");
  revalidatePath("/core/observations");
  revalidatePath("/admin");
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

  const workflow = await buildReviewWorkflowState({
    observerId: obs.observerId,
    existingAssignedReviewers: obs.assignedReviewers,
    isDraft,
  });
  const updatedAt = workflow.submittedAt ?? new Date();

  // Update Observation & Reset Workflow
  await db.update(observations)
    .set({
      status: workflow.status,
      assignedReviewers: workflow.assignedReviewers,
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
      
      updatedAt,
    })
    .where(eq(observations.id, id));

  console.log("[observations] editObservationAction", {
    id,
    editorId: session.user.id,
    status: workflow.status,
    assignedReviewers: workflow.assignedReviewers,
    submittedAt: workflow.submittedAt?.toISOString() ?? null,
  });

  if (!isDraft) {
    await notifyObservationSubmitted({
      observationId: id,
      title: data.title,
      observerName: session.user.name || "A member",
      assignedReviewerIds: workflow.assignedReviewers,
    });
  }

  revalidatePath("/portal/observations");
  revalidatePath("/core/observations");
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

  if (obs.status !== "Under_Review" && obs.status !== "Submitted") {
    throw new Error(`Cannot vote on observation in status: ${obs.status}`);
  }

  const assignedReviewers = Array.isArray(obs.assignedReviewers)
    ? (obs.assignedReviewers as string[])
    : [];
  if (
    assignedReviewers.length > 0 &&
    !assignedReviewers.includes(session.user.id)
  ) {
    throw new Error("Forbidden: You are not assigned to review this observation.");
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

  if (newStatus === "Core_Approved") {
    await notifyAdminCoreApproved({
      observationId: id,
      title: obs.title,
    });
  } else if (newStatus === "Rejected") {
    await notifyObserverDecision({
      observerId: obs.observerId,
      title: obs.title,
      decision: "reject",
      reason: rejectionReasonStr,
    });
  }

  revalidatePath("/core/observations");
  revalidatePath("/admin");
  return { success: true, status: newStatus };
}

// ==========================================
// 3. ADMIN PUBLISHING
// ==========================================

export async function adminFinalizeObservationAction(id: string, decision: "approve" | "reject", reason?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const profile = await getUserProfile(session.user.id);
  const isAdmin =
    profile?.normalizedRole === "Admin" ||
    (await hasPermission(session.user.id, "delete_files"));
  if (!isAdmin) throw new Error("Forbidden: Admin required");

  const newStatus = decision === "approve" ? "Published" : "Rejected";
  const [existing] = await db.select().from(observations).where(eq(observations.id, id));
  if (!existing) throw new Error("Observation not found");

  await db.update(observations)
    .set({
      status: newStatus as any,
      adminDecision: decision,
      rejectionReason: decision === "reject" ? reason : null,
      updatedAt: new Date()
    })
    .where(eq(observations.id, id));

  await notifyObserverDecision({
    observerId: existing.observerId,
    title: existing.title,
    decision,
    reason: decision === "reject" ? reason ?? null : null,
  });

  revalidatePath("/admin");
  revalidatePath("/observations");
  revalidatePath("/portal/observations");
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

export async function getCoreReviewQueueAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  const isCore = await hasPermission(session.user.id, "manage_projects");
  if (!isCore) {
    console.log("[observations] getCoreReviewQueueAction denied", {
      userId: session.user.id,
    });
    return [];
  }

  const rawQueue = await db
    .select()
    .from(observations)
    .where(
      or(
        eq(observations.status, "Submitted"),
        eq(observations.status, "Under_Review")
      )
    )
    .orderBy(desc(observations.updatedAt));

  const queue = rawQueue.filter((observation) => {
    const assignedReviewers = Array.isArray(observation.assignedReviewers)
      ? (observation.assignedReviewers as string[])
      : [];

    return (
      assignedReviewers.length === 0 ||
      assignedReviewers.includes(session.user.id)
    );
  });

  console.log("[observations] getCoreReviewQueueAction", {
    userId: session.user.id,
    total: queue.length,
    observations: queue.map((observation) => ({
      id: observation.id,
      status: observation.status,
      assignedReviewers: observation.assignedReviewers,
      approvals: Array.isArray(observation.approvals)
        ? observation.approvals.length
        : 0,
      rejections: Array.isArray(observation.rejections)
        ? observation.rejections.length
        : 0,
    })),
  });

  return queue;
}

export async function getAllObservationsForAdminAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];
  const profile = await getUserProfile(session.user.id);
  const isAdmin =
    profile?.normalizedRole === "Admin" ||
    (await hasPermission(session.user.id, "delete_files"));
  if (!isAdmin) {
    console.log("[observations] getAllObservationsForAdminAction denied", {
      userId: session.user.id,
      role: profile?.normalizedRole ?? "none",
    });
    return [];
  }
  
  const results = await db.select().from(observations).orderBy(desc(observations.createdAt));
  console.log(
    "[observations] getAllObservationsForAdminAction",
    {
      userId: session.user.id,
      role: profile?.normalizedRole ?? "none",
      total: results.length,
      observations: results.map((observation) => ({
        id: observation.id,
        status: observation.status,
        assignedReviewers: observation.assignedReviewers,
        reportsCount: observation.reportsCount,
      })),
    }
  );

  return results;
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
