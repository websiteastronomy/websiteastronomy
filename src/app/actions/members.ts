"use server";

import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/permissions";

/**
 * RBAC-aware user approval action.
 *
 * Sets:
 *   - status → 'approved'
 *   - role   → legacy string (preserved for backward-compat)
 *   - roleId → FK pointing to the correct roles table entry
 *
 * Only callable by users with the `approve_actions` RBAC permission
 * (Core Committee + Admin).
 */
export async function approveUserAction(
  targetUserId: string,
  roleName: "Member" | "Lead" | "Core Committee" | "Admin"
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const canApprove = await hasPermission(session.user.id, "approve_actions");
  if (!canApprove) throw new Error("Insufficient permissions");

  // Look up the RBAC role by name
  const roleRes = await db
    .select()
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);

  if (!roleRes.length) {
    throw new Error(`Role "${roleName}" not found in RBAC table. Run seed script first.`);
  }

  const roleId = roleRes[0].id;

  // Legacy role string mapping (backward-compat anchor)
  const legacyRoleMap: Record<string, string> = {
    "Admin": "admin",
    "Core Committee": "core",
    "Lead": "lead",
    "Member": "member",
  };
  const legacyRole = legacyRoleMap[roleName] ?? "member";

  await db
    .update(users)
    .set({
      status: "approved",
      role: legacyRole,   // LEGACY - kept for backward compat
      roleId,             // RBAC FK - source of truth
      updatedAt: new Date(),
    })
    .where(eq(users.id, targetUserId));

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Reject a pending user account.
 * Only callable by users with `approve_actions` permission.
 */
export async function rejectUserAction(targetUserId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const canApprove = await hasPermission(session.user.id, "approve_actions");
  if (!canApprove) throw new Error("Insufficient permissions");

  await db
    .update(users)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(users.id, targetUserId));

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Fetches all users for the admin panel.
 * Only callable by users with `approve_actions` permission.
 */
export async function getAllUsersAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];

  const canView = await hasPermission(session.user.id, "approve_actions");
  if (!canView) return [];

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      status: users.status,
      role: users.role,      // legacy
      roleId: users.roleId,  // RBAC
      createdAt: users.createdAt,
      // Profile unification fields
      profileImageKey: users.profileImageKey,
      image: users.image,
      department: users.department,
      quote: users.quote,
      responsibility: users.responsibility,
      isPublic: users.isPublic,
    })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id));

  return allUsers;
}

/**
 * Update an existing user's role.
 */
export async function updateUserRoleAction(
  targetUserId: string,
  roleName: "Member" | "Lead" | "Core Committee" | "Admin"
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const canApprove = await hasPermission(session.user.id, "approve_actions");
  if (!canApprove) throw new Error("Insufficient permissions");

  const roleRes = await db
    .select()
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);

  if (!roleRes.length) throw new Error(`Role "${roleName}" not found`);

  const roleId = roleRes[0].id;
  const legacyRoleMap: Record<string, string> = {
    "Admin": "admin",
    "Core Committee": "core",
    "Lead": "lead",
    "Member": "member",
  };

  await db
    .update(users)
    .set({
      role: legacyRoleMap[roleName] ?? "member",
      roleId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, targetUserId));

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Delete a user from the database.
 */
export async function deleteUserAction(targetUserId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const canApprove = await hasPermission(session.user.id, "approve_actions");
  if (!canApprove) throw new Error("Insufficient permissions");

  await db.delete(users).where(eq(users.id, targetUserId));
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Admin-only: Update a user's metadata (responsibility, isPublic, department).
 */
export async function updateUserMetadataAction(
  targetUserId: string,
  data: { responsibility?: string; isPublic?: boolean; department?: string }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const canApprove = await hasPermission(session.user.id, "approve_actions");
  if (!canApprove) throw new Error("Insufficient permissions");

  await db
    .update(users)
    .set({
      ...(data.responsibility !== undefined && { responsibility: data.responsibility }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
      ...(data.department !== undefined && { department: data.department }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, targetUserId));

  revalidatePath("/admin");
  revalidatePath("/about");
  return { success: true };
}

/**
 * User self-edit: Update own profile image key and quote.
 * Users CANNOT edit role, responsibility, or approval status.
 */
export async function updateUserProfileAction(
  data: { profileImageKey?: string; quote?: string }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  await db
    .update(users)
    .set({
      ...(data.profileImageKey !== undefined && { profileImageKey: data.profileImageKey }),
      ...(data.quote !== undefined && { quote: data.quote }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/portal");
  return { success: true };
}
