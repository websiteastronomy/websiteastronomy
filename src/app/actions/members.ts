"use server";

import { db } from "@/db";
import { users, roles, permissions, role_permissions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  assertValidRoleName,
  requireAdminAccess,
  requireApprovalAccess,
} from "@/lib/member-access";
import { logActivity } from "@/lib/activity-logs";

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
  const access = await requireApprovalAccess(session.user.id);
  assertValidRoleName(roleName);
  if (!access.isAdmin && roleName === "Admin") {
    throw new Error("Forbidden");
  }

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

  await logActivity({
    userId: session.user.id,
    action: "approve_member",
    entityType: "user",
    entityId: targetUserId,
    role: access.roleName,
    details: { roleName },
  });

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
  await requireApprovalAccess(session.user.id);

  await db
    .update(users)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(users.id, targetUserId));

  const access = await requireApprovalAccess(session.user.id);
  await logActivity({
    userId: session.user.id,
    action: "reject_member",
    entityType: "user",
    entityId: targetUserId,
    role: access.roleName,
  });

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
  const access = await requireApprovalAccess(session.user.id).catch(() => null);
  if (!access) return [];

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

export async function getRolePermissionsCatalogAction() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  await requireAdminAccess(session.user.id);

  const roleRows = await db.select().from(roles);
  const permissionRows = await db.select().from(permissions);
  const rolePermissionRows = await db.select().from(role_permissions);

  return {
    permissions: permissionRows.map((permission) => ({
      id: permission.id,
      key: permission.key,
      description: permission.description,
    })),
    roles: roleRows.map((role) => ({
      id: role.id,
      name: role.name,
      permissions: rolePermissionRows
        .filter((item) => item.roleId === role.id)
        .map((item) => {
          const match = permissionRows.find((permission) => permission.id === item.permissionId);
          return match?.key;
        })
        .filter(Boolean) as string[],
    })),
  };
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
  await requireAdminAccess(session.user.id);
  assertValidRoleName(roleName);

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

  const access = await requireAdminAccess(session.user.id);
  await logActivity({
    userId: session.user.id,
    action: "update_member_role",
    entityType: "user",
    entityId: targetUserId,
    role: access.roleName,
    details: { roleName },
  });

  revalidatePath("/admin");
  return { success: true };
}

export async function updateRolePermissionsAction(
  roleName: "Member" | "Lead" | "Core Committee" | "Admin",
  permissionKeys: string[]
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  await requireAdminAccess(session.user.id);
  assertValidRoleName(roleName);

  const roleRes = await db
    .select()
    .from(roles)
    .where(eq(roles.name, roleName))
    .limit(1);
  if (!roleRes.length) throw new Error(`Role "${roleName}" not found`);

  const permissionRows = permissionKeys.length
    ? await db.select().from(permissions).where(inArray(permissions.key, permissionKeys))
    : [];

  if (permissionRows.length !== permissionKeys.length) {
    throw new Error("One or more permissions are invalid");
  }

  await db.delete(role_permissions).where(eq(role_permissions.roleId, roleRes[0].id));

  if (permissionRows.length > 0) {
    await db.insert(role_permissions).values(
      permissionRows.map((permission) => ({
        id: crypto.randomUUID(),
        roleId: roleRes[0].id,
        permissionId: permission.id,
      }))
    );
  }

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Delete a user from the database.
 */
export async function deleteUserAction(targetUserId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  await requireAdminAccess(session.user.id);

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
  const access = await requireApprovalAccess(session.user.id);
  const updates: {
    responsibility?: string;
    isPublic?: boolean;
    department?: string;
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };

  if (data.responsibility !== undefined) {
    updates.responsibility = data.responsibility;
  }
  if (data.department !== undefined) {
    updates.department = data.department;
  }
  if (data.isPublic !== undefined) {
    if (!access.isAdmin) {
      throw new Error("Forbidden");
    }
    updates.isPublic = data.isPublic;
  }

  await db
    .update(users)
    .set(updates)
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
