"use server";

import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { activity_logs, users } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSystemAccess } from "@/lib/system-rbac";

export type AuditLogFilters = {
  search?: string;
  action?: string;
  entityType?: string;
  fromDate?: string | null;
  toDate?: string | null;
};

function normalizeDateStart(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeDateEnd(value?: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getAuditLogsAction(filters: AuditLogFilters = {}, limit: number = 100) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const access = await getSystemAccess(session.user.id);
  if (!(access.isAdmin || access.canApproveActions)) throw new Error("Forbidden");

  const conditions = [];
  if (filters.search?.trim()) {
    const query = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(activity_logs.action, query),
        ilike(activity_logs.entityType, query),
        ilike(activity_logs.entityId, query),
        ilike(users.name, query),
        ilike(users.email, query)
      )
    );
  }

  if (filters.action?.trim()) {
    conditions.push(ilike(activity_logs.action, `%${filters.action.trim()}%`));
  }

  if (filters.entityType?.trim()) {
    conditions.push(ilike(activity_logs.entityType, `%${filters.entityType.trim()}%`));
  }

  const fromDate = normalizeDateStart(filters.fromDate);
  if (fromDate) conditions.push(gte(activity_logs.timestamp, fromDate));
  const toDate = normalizeDateEnd(filters.toDate);
  if (toDate) conditions.push(lte(activity_logs.timestamp, toDate));

  const rows = await db
    .select({
      id: activity_logs.id,
      action: activity_logs.action,
      targetEntity: activity_logs.entityType,
      entityId: activity_logs.entityId,
      createdAt: activity_logs.timestamp,
      actorId: activity_logs.userId,
      actorName: users.name,
      actorEmail: users.email,
      metadata: activity_logs.details,
      role: activity_logs.role,
      ipAddress: activity_logs.ipAddress,
    })
    .from(activity_logs)
    .leftJoin(users, eq(activity_logs.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(activity_logs.timestamp))
    .limit(limit);

  return rows;
}
