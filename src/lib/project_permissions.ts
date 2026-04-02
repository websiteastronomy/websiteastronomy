import { db } from "@/db";
import { project_members, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hasPermission } from "./permissions";

export interface ProjectPermissions {
  canView: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canComment: boolean;
  isProjectLead: boolean;
}

/**
 * Derives comprehensive project access controls for a user on a specific project.
 * Enforces Phase 2 Project Access Control Rules.
 */
export async function getProjectPermissions(projectId: string, userId: string | undefined | null): Promise<ProjectPermissions> {
  // Base case: Public read-only
  const basePerms: ProjectPermissions = {
    canView: true,
    canUpload: false,
    canEdit: false,
    canComment: false,
    isProjectLead: false,
  };

  if (!userId) return basePerms;

  // Global Admins/Core usually have override powers (Phase 1)
  const isGlobalAdmin = await hasPermission(userId, "manage_projects");
  if (isGlobalAdmin) {
    return {
      canView: true,
      canUpload: true,
      canEdit: true,
      canComment: true,
      isProjectLead: true, // Treat global admins as local leads implicitly
    };
  }

  // Local Project Role check
  const memberRecord = await db
    .select()
    .from(project_members)
    .where(
      and(
        eq(project_members.projectId, projectId),
        eq(project_members.userId, userId)
      )
    )
    .limit(1);

  if (memberRecord.length === 0) {
    // Non-member (just logged in)
    return basePerms;
  }

  const role = memberRecord[0].role; // "member" or "lead"

  // If assigned to project: View, Upload, Edit, Comment = true
  return {
    canView: true,
    canUpload: true,
    canEdit: true,
    canComment: true,
    isProjectLead: role === "lead",
  };
}

/**
 * Security Guard: Throws if user doesn't have required permission
 */
export async function assertProjectPermission(
  projectId: string, 
  userId: string | undefined | null, 
  action: keyof ProjectPermissions
) {
  const perms = await getProjectPermissions(projectId, userId);
  if (!perms[action]) {
    throw new Error(`Unauthorized: Project Access Denied (${action})`);
  }
  return perms;
}
