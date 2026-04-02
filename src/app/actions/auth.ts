"use server";

import { db } from "@/db";
import { users, roles, permissions, role_permissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface RBACProfile {
  status: string;
  roleName: string;
  permissions: string[];
}

/**
 * Returns the current authenticated user's RBAC profile:
 * { status, roleName, permissions[] }
 *
 * Called from AuthContext (client) and event pages so the frontend
 * can make permission decisions WITHOUT hard-coding role names or
 * relying on the legacy `role` string column.
 */
export async function getMyRBACProfile(): Promise<RBACProfile | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;

    const userId = session.user.id;

    const userRes = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userRes.length) return null;
    const user = userRes[0];

    // User exists but has no roleId yet (e.g. brand-new registration)
    if (!user.roleId) {
      return { status: user.status, roleName: "none", permissions: [] };
    }

    // Fetch role name
    const roleRes = await db
      .select()
      .from(roles)
      .where(eq(roles.id, user.roleId))
      .limit(1);
    const roleName = roleRes[0]?.name || "none";

    // Fetch all permission keys for this role
    const permRes = await db
      .select({ key: permissions.key })
      .from(permissions)
      .innerJoin(
        role_permissions,
        eq(role_permissions.permissionId, permissions.id)
      )
      .where(eq(role_permissions.roleId, user.roleId));

    return {
      status: user.status,
      roleName,
      permissions: permRes.map((p) => p.key),
    };
  } catch (err) {
    console.error("[getMyRBACProfile] Error:", err);
    return null;
  }
}
