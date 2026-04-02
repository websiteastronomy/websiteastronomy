import { db } from "@/db";
import { users, roles, permissions, role_permissions } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";

/**
 * Validates if a given user possesses the specified permission key through their assigned role.
 * Example usage: hasPermission(user.id, "manage_projects")
 */
export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
  const userRes = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userRes.length || !userRes[0].roleId) return false;
  
  const roleId = userRes[0].roleId;

  // Optimize: we can join role_permissions and permissions to check if the specific key exists for this roleId
  const result = await db.select({
      id: permissions.id
  })
  .from(permissions)
  .innerJoin(role_permissions, eq(role_permissions.permissionId, permissions.id))
  .where(
    and(
      eq(role_permissions.roleId, roleId),
      eq(permissions.key, permissionKey)
    )
  ).limit(1);

  return result.length > 0;
}

/**
 * Returns all permission keys for a given user. Useful for pushing to the frontend context.
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRes = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!userRes.length || !userRes[0].roleId) return [];
  
  const roleId = userRes[0].roleId;

  const result = await db.select({
      key: permissions.key
  })
  .from(permissions)
  .innerJoin(role_permissions, eq(role_permissions.permissionId, permissions.id))
  .where(eq(role_permissions.roleId, roleId));

  return result.map(p => p.key);
}

/**
 * Fetches the user profile alongside their proper Role metadata.
 */
export async function getUserProfile(userId: string) {
  const result = await db.select({
      user: users,
      roleName: roles.name
  })
  .from(users)
  .leftJoin(roles, eq(users.roleId, roles.id))
  .where(eq(users.id, userId))
  .limit(1);

  if (!result.length) return null;
  return {
      ...result[0].user,
      normalizedRole: result[0].roleName || "none"
  };
}
