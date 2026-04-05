"use server";

import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserPermissions } from "@/lib/permissions";

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

    const effectivePermissions = await getUserPermissions(userId);

    return {
      status: user.status,
      roleName,
      permissions: effectivePermissions,
    };
  } catch (err) {
    console.error("[getMyRBACProfile] Error:", err);
    return null;
  }
}
