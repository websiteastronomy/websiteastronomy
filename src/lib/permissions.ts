import { db } from "@/db";
import { users, roles, permissions, role_permissions, user_permissions } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getUserLifecycleState, isLifecycleAllowedAccess } from "@/lib/user-lifecycle";

type PermissionCapabilities = {
  hasUserPermissions: boolean;
};

let permissionCapabilitiesPromise: Promise<PermissionCapabilities> | null = null;

function extractRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === "object" && "rows" in result && Array.isArray((result as any).rows)) {
    return (result as any).rows as Array<Record<string, unknown>>;
  }
  return [];
}

async function getPermissionCapabilities(): Promise<PermissionCapabilities> {
  if (!permissionCapabilitiesPromise) {
    permissionCapabilitiesPromise = (async () => {
      const result = await db.execute(sql`
        select table_name
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'user_permissions'
      `);
      const tableNames = new Set(extractRows(result).map((row) => String(row.table_name)));
      return {
        hasUserPermissions: tableNames.has("user_permissions"),
      };
    })();
  }

  return permissionCapabilitiesPromise;
}

export async function getUserPermissionOverride(userId: string, permissionKey: string): Promise<boolean | null> {
  const capabilities = await getPermissionCapabilities();
  if (!capabilities.hasUserPermissions) {
    return null;
  }

  const rows = await db
    .select({ allowed: user_permissions.allowed })
    .from(user_permissions)
    .where(and(eq(user_permissions.userId, userId), eq(user_permissions.permissionKey, permissionKey)))
    .limit(1);

  return rows.length ? rows[0].allowed : null;
}

/**
 * Validates if a given user possesses the specified permission key.
 * Priority:
 * 1. user_permissions override
 * 2. role-based permission
 */
export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
  const userRes = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userRes.length) return false;
  const lifecycleState = await getUserLifecycleState(userId);
  if (!isLifecycleAllowedAccess(lifecycleState)) return false;

  const override = await getUserPermissionOverride(userId, permissionKey);
  if (override !== null) {
    return override;
  }

  if (!userRes[0].roleId) return false;
  const roleId = userRes[0].roleId;

  const result = await db.select({
    id: permissions.id,
  })
    .from(permissions)
    .innerJoin(role_permissions, eq(role_permissions.permissionId, permissions.id))
    .where(
      and(
        eq(role_permissions.roleId, roleId),
        eq(permissions.key, permissionKey)
      )
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Returns the effective permission keys for a user after applying per-user overrides.
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRes = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userRes.length) return [];
  const lifecycleState = await getUserLifecycleState(userId);
  if (!isLifecycleAllowedAccess(lifecycleState)) return [];

  const effective = new Set<string>();

  if (userRes[0].roleId) {
    const result = await db.select({
      key: permissions.key,
    })
      .from(permissions)
      .innerJoin(role_permissions, eq(role_permissions.permissionId, permissions.id))
      .where(eq(role_permissions.roleId, userRes[0].roleId));

    for (const permission of result) {
      effective.add(permission.key);
    }
  }

  const capabilities = await getPermissionCapabilities();
  if (capabilities.hasUserPermissions) {
    const overrides = await db
      .select({
        permissionKey: user_permissions.permissionKey,
        allowed: user_permissions.allowed,
      })
      .from(user_permissions)
      .where(eq(user_permissions.userId, userId));

    for (const override of overrides) {
      if (override.allowed) {
        effective.add(override.permissionKey);
      } else {
        effective.delete(override.permissionKey);
      }
    }
  }

  return [...effective];
}

export async function getUserProfile(userId: string) {
  const result = await db.select({
    user: users,
    roleName: roles.name,
  })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!result.length) return null;
  const lifecycleState = await getUserLifecycleState(userId);
  return {
    ...result[0].user,
    normalizedRole: result[0].roleName || "none",
    lifecycleState,
  };
}
