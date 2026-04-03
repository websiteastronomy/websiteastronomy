import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserProfile, hasPermission } from "@/lib/permissions";

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function getSystemAccess(userId: string) {
  const profile = await getUserProfile(userId);
  const isAdmin =
    profile?.normalizedRole === "Admin" ||
    (await hasPermission(userId, "assign_roles")) ||
    (await hasPermission(userId, "delete_files"));

  return {
    roleName: profile?.normalizedRole || "none",
    isAdmin,
    canManageProjects: isAdmin || (await hasPermission(userId, "manage_projects")),
    canManageEvents: isAdmin || (await hasPermission(userId, "manage_events")),
    canApproveActions: isAdmin || (await hasPermission(userId, "approve_actions")),
    canManageMembers: isAdmin || (await hasPermission(userId, "manage_members")),
    canViewAnalytics: isAdmin || (await hasPermission(userId, "view_analytics")),
  };
}

export async function requireAuthenticatedUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
