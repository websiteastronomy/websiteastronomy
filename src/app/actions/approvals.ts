"use server";

import { db } from "@/db";
import { approvals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/permissions";
import { castApprovalVoteAction } from "@/lib/approval_engine";

export async function getPendingApprovalsAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const canManage = await hasPermission(session.user.id, "manage_projects");
  if (!canManage) throw new Error("Forbidden");

  // For UI, we enrich votes manually if needed, but here we can just fetch approvals
  // Real implementation would join or calculate votes, but we can do a basic select
  const pending = await db.select().from(approvals).where(eq(approvals.status, "pending")).orderBy(desc(approvals.createdAt));
  
  // In a robust flow, fetch vote count per approval. 
  // For now, we will return it with a mock `votes` field 
  return pending.map(a => ({
    ...a,
    votes: 0 // Fetch actual votes via aggregate if requested
  }));
}

export async function castVoteAction(approvalId: string, vote: "approve" | "reject") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  await castApprovalVoteAction(approvalId, session.user.id, vote);
}
