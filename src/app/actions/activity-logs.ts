"use server";

import { and, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { activity_logs, users } from "@/db/schema";
import { getSessionUser, getSystemAccess, requireAuthenticatedUser } from "@/lib/system-rbac";
import { logActivity } from "@/lib/activity-logs";

export type ActivityLogCategory =
  | "all"
  | "authentication"
  | "content"
  | "permissions"
  | "system"
  | "error"
  | "announcements";

export type ActivityLogFilters = {
  search?: string;
  user?: string;
  action?: string;
  entity?: string;
  category?: ActivityLogCategory;
  fromDate?: string | null;
  toDate?: string | null;
};

type ActivityLogRow = {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  timestamp: Date | null;
  ipAddress: string | null;
  role: string | null;
};

function isMissingActivityLogTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("activity_logs") && (
    message.includes("does not exist") ||
    message.includes("relation") ||
    message.includes("Failed query")
  );
}

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

function getActivityLogCategory(action: string, entityType: string) {
  const normalizedAction = action.toLowerCase();
  const normalizedEntity = entityType.toLowerCase();

  if (normalizedEntity === "auth" || normalizedAction.includes("login") || normalizedAction.includes("logout")) {
    return "authentication" as const;
  }

  if (
    normalizedEntity === "announcement" ||
    normalizedAction.includes("announcement")
  ) {
    return "announcements" as const;
  }

  if (
    normalizedEntity === "user" ||
    normalizedEntity === "role" ||
    normalizedEntity === "permission" ||
    normalizedAction.includes("role") ||
    normalizedAction.includes("member") ||
    normalizedAction.includes("approve") ||
    normalizedAction.includes("reject")
  ) {
    return "permissions" as const;
  }

  if (
    normalizedEntity === "article" ||
    normalizedEntity === "observation" ||
    normalizedEntity === "event" ||
    normalizedEntity === "project" ||
    normalizedEntity === "quiz" ||
    normalizedEntity === "outreach"
  ) {
    return "content" as const;
  }

  if (
    normalizedAction.includes("error") ||
    normalizedAction.includes("fail") ||
    normalizedEntity === "error"
  ) {
    return "error" as const;
  }

  return "system" as const;
}

function buildSqlFilters(filters: ActivityLogFilters) {
  const conditions = [];

  if (filters.search?.trim()) {
    const query = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(users.name, query),
        ilike(users.email, query),
        ilike(activity_logs.action, query),
        ilike(activity_logs.entityType, query),
        ilike(activity_logs.entityId, query)
      )
    );
  }

  if (filters.user?.trim()) {
    const userQuery = `%${filters.user.trim()}%`;
    conditions.push(
      or(
        ilike(users.name, userQuery),
        ilike(users.email, userQuery),
        ilike(activity_logs.userId, userQuery)
      )
    );
  }

  if (filters.action?.trim()) {
    conditions.push(ilike(activity_logs.action, `%${filters.action.trim()}%`));
  }

  if (filters.entity?.trim()) {
    const entityQuery = `%${filters.entity.trim()}%`;
    conditions.push(
      or(
        ilike(activity_logs.entityType, entityQuery),
        ilike(activity_logs.entityId, entityQuery)
      )
    );
  }

  const fromDate = normalizeDateStart(filters.fromDate);
  if (fromDate) {
    conditions.push(gte(activity_logs.timestamp, fromDate));
  }

  const toDate = normalizeDateEnd(filters.toDate);
  if (toDate) {
    conditions.push(lte(activity_logs.timestamp, toDate));
  }

  return conditions.length ? and(...conditions) : undefined;
}

function mapActivityLogRow(row: ActivityLogRow) {
  const category = getActivityLogCategory(row.action, row.entityType);
  return {
    ...row,
    userName: row.userName || "System",
    userEmail: row.userEmail || null,
    timestamp: row.timestamp?.toISOString() || null,
    category,
  };
}

function toLogDetails(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export async function getActivityLogsAction(filters: ActivityLogFilters = {}) {
  const user = await requireAuthenticatedUser();
  const access = await getSystemAccess(user.id);
  if (!(access.isAdmin || access.canApproveActions)) {
    throw new Error("Forbidden");
  }

  try {
    const where = buildSqlFilters(filters);
    const rows = await db
      .select({
        id: activity_logs.id,
        userId: activity_logs.userId,
        userName: users.name,
        userEmail: users.email,
        action: activity_logs.action,
        entityType: activity_logs.entityType,
        entityId: activity_logs.entityId,
        details: activity_logs.details,
        timestamp: activity_logs.timestamp,
        ipAddress: activity_logs.ipAddress,
        role: activity_logs.role,
      })
      .from(activity_logs)
      .leftJoin(users, eq(activity_logs.userId, users.id))
      .where(where)
      .orderBy(desc(activity_logs.timestamp))
      .limit(250);

    const mappedRows = rows.map((row) =>
      mapActivityLogRow({
        ...row,
        details: toLogDetails(row.details),
      })
    );
    if (!filters.category || filters.category === "all") {
      return mappedRows;
    }

    return mappedRows.filter((row) => row.category === filters.category);
  } catch (error) {
    if (isMissingActivityLogTableError(error)) {
      console.warn("[activity-logs] table not available yet; returning empty log list.");
      return [];
    }
    throw error;
  }
}

export async function getMyRecentActivityAction() {
  const user = await requireAuthenticatedUser();
  try {
    const rows = await db
      .select({
        id: activity_logs.id,
        userId: activity_logs.userId,
        userName: users.name,
        userEmail: users.email,
        action: activity_logs.action,
        entityType: activity_logs.entityType,
        entityId: activity_logs.entityId,
        details: activity_logs.details,
        timestamp: activity_logs.timestamp,
        ipAddress: activity_logs.ipAddress,
        role: activity_logs.role,
      })
      .from(activity_logs)
      .leftJoin(users, eq(activity_logs.userId, users.id))
      .where(eq(activity_logs.userId, user.id))
      .orderBy(desc(activity_logs.timestamp))
      .limit(5);

    return rows.map((row) =>
      mapActivityLogRow({
        ...row,
        details: toLogDetails(row.details),
      })
    );
  } catch (error) {
    if (isMissingActivityLogTableError(error)) {
      console.warn("[activity-logs] table not available yet; returning empty personal activity.");
      return [];
    }
    throw error;
  }
}

export async function getMyActivityFeedAction(page: number = 1, pageSize: number = 20) {
  const user = await requireAuthenticatedUser();
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1;
  const safePageSize = Number.isFinite(pageSize) ? Math.min(50, Math.max(5, Math.floor(pageSize))) : 20;
  const offset = (safePage - 1) * safePageSize;

  try {
    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: activity_logs.id,
          userId: activity_logs.userId,
          userName: users.name,
          userEmail: users.email,
          action: activity_logs.action,
          entityType: activity_logs.entityType,
          entityId: activity_logs.entityId,
          details: activity_logs.details,
          timestamp: activity_logs.timestamp,
          ipAddress: activity_logs.ipAddress,
          role: activity_logs.role,
        })
        .from(activity_logs)
        .leftJoin(users, eq(activity_logs.userId, users.id))
        .where(eq(activity_logs.userId, user.id))
        .orderBy(desc(activity_logs.timestamp))
        .limit(safePageSize)
        .offset(offset),
      db
        .select({ value: count() })
        .from(activity_logs)
        .where(eq(activity_logs.userId, user.id)),
    ]);

    const total = totalResult[0]?.value ?? 0;
    return {
      rows: rows.map((row) =>
        mapActivityLogRow({
          ...row,
          details: toLogDetails(row.details),
        })
      ),
      page: safePage,
      pageSize: safePageSize,
      total,
      hasMore: offset + rows.length < total,
    };
  } catch (error) {
    if (isMissingActivityLogTableError(error)) {
      console.warn("[activity-logs] table not available yet; returning empty activity feed.");
      return {
        rows: [],
        page: safePage,
        pageSize: safePageSize,
        total: 0,
        hasMore: false,
      };
    }
    throw error;
  }
}

export async function recordAuthActivityAction(action: "login" | "logout") {
  const user = await getSessionUser();
  if (!user) {
    return { success: false, skipped: "no-session" as const };
  }
  const access = await getSystemAccess(user.id);
  await logActivity({
    userId: user.id,
    action,
    entityType: "auth",
    entityId: user.id,
    role: access.roleName,
    details: { email: user.email },
  });
  return { success: true };
}
