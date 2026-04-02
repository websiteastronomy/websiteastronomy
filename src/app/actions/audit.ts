"use server";

import { db } from "@/db";
import { audit_logs, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/permissions";

export async function getAuditLogsAction(limit: number = 50) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const canManage = await hasPermission(session.user.id, "manage_projects");
  if (!canManage) throw new Error("Forbidden");

  // Fetch audit logs and join with actor details
  const logs = await db.select({
    id: audit_logs.id,
    action: audit_logs.action,
    targetEntity: audit_logs.targetEntity,
    entityId: audit_logs.entityId,
    createdAt: audit_logs.createdAt,
    actorId: audit_logs.actorId,
    actorName: users.name,
    actorEmail: users.email,
  })
  .from(audit_logs)
  .leftJoin(users, eq(audit_logs.actorId, users.id))
  .orderBy(desc(audit_logs.createdAt))
  .limit(limit);

  return logs;
}
