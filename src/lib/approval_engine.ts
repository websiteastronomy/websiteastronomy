import { db } from "@/db";
import { approvals, approval_votes, audit_logs, notifications, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { assertProjectPermission } from "./project_permissions";
import { hasPermission } from "./permissions";

/**
 * Creates a new approval request and notifies admins/core.
 */
export async function createApprovalRequestAction(
  requesterId: string,
  targetAction: string,
  targetEntityId: string,
  payload: any
) {
  const approvalId = uuidv4();
  
  await db.insert(approvals).values({
    id: approvalId,
    requestedBy: requesterId,
    targetAction,
    targetEntityId,
    payload,
    status: "pending",
  });

  // Notify Core Committee & Admins
  const allUsers = await db.select().from(users);
  
  for (const user of allUsers) {
    const isCore = await hasPermission(user.id, "manage_projects");
    if (isCore) {
      await db.insert(notifications).values({
        id: uuidv4(),
        userId: user.id,
        type: "approval_request",
        title: "New Approval Request",
        message: `Action required: ${targetAction} on ${targetEntityId}`,
        link: `/admin/approvals`, // Example deep link
      });
    }
  }

  // Audit log
  await db.insert(audit_logs).values({
    id: uuidv4(),
    actorId: requesterId,
    action: "CREATED_APPROVAL_REQUEST",
    targetEntity: "approval",
    entityId: approvalId,
  });

  return approvalId;
}

/**
 * Casts a vote on an active approval. Checks if consensus (threshold) is met to auto-execute.
 */
export async function castApprovalVoteAction(
  approvalId: string,
  voterId: string,
  vote: "approve" | "reject",
  threshold: number = 3
) {
  // Must be an admin/core to vote
  const canVote = await hasPermission(voterId, "manage_projects");
  if (!canVote) throw new Error("Unauthorized to vote.");

  // Check if approval is still pending
  const [approval] = await db.select().from(approvals).where(eq(approvals.id, approvalId));
  if (!approval || approval.status !== "pending") return;

  // Insert vote
  await db.insert(approval_votes).values({
    id: uuidv4(),
    approvalId,
    voterId,
    vote,
  });

  // Audit log
  await db.insert(audit_logs).values({
    id: uuidv4(),
    actorId: voterId,
    action: `VOTED_${vote.toUpperCase()}`,
    targetEntity: "approval",
    entityId: approvalId,
  });

  // Evaluate consensus
  const allVotes = await db.select().from(approval_votes).where(eq(approval_votes.approvalId, approvalId));
  const approveCount = allVotes.filter(v => v.vote === "approve").length;
  const rejectCount = allVotes.filter(v => v.vote === "reject").length;

  if (approveCount >= threshold) {
    await db.update(approvals).set({ status: "approved" }).where(eq(approvals.id, approvalId));
    await executeApprovalPayload(approval, allVotes);
  } else if (rejectCount >= threshold) {
    await db.update(approvals).set({ status: "rejected" }).where(eq(approvals.id, approvalId));
    
    // Notify requester
    await db.insert(notifications).values({
      id: uuidv4(),
      userId: approval.requestedBy,
      type: "system",
      title: "Request Rejected",
      message: `Your request for ${approval.targetAction} has been rejected.`,
    });
  }
}

/**
 * Executes the actual side effect when consensus is reached.
 */
async function executeApprovalPayload(approval: any, votes: any[]) {
  // Extend this switch statement with actual business logic handlers
  switch (approval.targetAction) {
    case 'DELETE_PROJECT':
      console.log(`System: Executing DELETE_PROJECT on ${approval.targetEntityId}...`);
      // Use imported server action or DB query to delete project
      break;

    case 'ESCALATE_MEMBER_ROLE':
      console.log(`System: Executing ROLE ESCALATION on ${approval.targetEntityId}...`);
      // Update users table / role_permissions table based on approval.payload
      break;
    
    default:
      console.error(`Unknown targetAction ${approval.targetAction}`);
  }

  // Notify requester of success
  await db.insert(notifications).values({
    id: uuidv4(),
    userId: approval.requestedBy,
    type: "system",
    title: "Request Approved",
    message: `Your request for ${approval.targetAction} has been approved and executed.`,
  });
}
