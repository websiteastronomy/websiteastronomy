import { getUserProfile, hasPermission } from "@/lib/permissions";

export const VALID_ROLE_NAMES = [
  "Member",
  "Lead",
  "Core Committee",
  "Admin",
] as const;

export type ValidRoleName = (typeof VALID_ROLE_NAMES)[number];

export function assertValidRoleName(roleName: string): asserts roleName is ValidRoleName {
  if (!VALID_ROLE_NAMES.includes(roleName as ValidRoleName)) {
    throw new Error(`Invalid role "${roleName}"`);
  }
}

export async function getMemberAccess(userId: string) {
  const profile = await getUserProfile(userId);
  const isAdmin =
    profile?.normalizedRole === "Admin" ||
    (await hasPermission(userId, "assign_roles")) ||
    (await hasPermission(userId, "delete_files"));
  const canApproveMembers = isAdmin || (await hasPermission(userId, "approve_actions"));

  return {
    isAdmin,
    canApproveMembers,
    roleName: profile?.normalizedRole || "none",
  };
}

export async function requireAdminAccess(userId: string) {
  const access = await getMemberAccess(userId);
  if (!access.isAdmin) {
    throw new Error("Forbidden");
  }

  return access;
}

export async function requireApprovalAccess(userId: string) {
  const access = await getMemberAccess(userId);
  if (!access.canApproveMembers) {
    throw new Error("Forbidden");
  }

  return access;
}
