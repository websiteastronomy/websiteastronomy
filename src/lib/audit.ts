import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { activity_logs, audit_logs } from "@/db/schema";

export type AuditLogInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  performedBy?: string | null;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  role?: string | null;
};

export async function writeAuditLog(input: AuditLogInput) {
  try {
    const headerStore = await headers().catch(() => null);
    const forwardedFor = headerStore?.get("x-forwarded-for") || null;
    const realIp = headerStore?.get("x-real-ip") || null;
    const ipAddress = input.ipAddress || forwardedFor?.split(",")[0]?.trim() || realIp || null;
    const timestamp = input.timestamp || new Date();

    await db.insert(activity_logs).values({
      id: uuidv4(),
      userId: input.performedBy || null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      details: input.metadata || {},
      timestamp,
      ipAddress,
      role: input.role || null,
    });

    if (input.entityId) {
      await db.insert(audit_logs).values({
        id: uuidv4(),
        actorId: input.performedBy || null,
        action: input.action,
        targetEntity: input.entityType,
        entityId: input.entityId,
        ipAddress,
        createdAt: timestamp,
      }).catch(() => {
        // Keep audit writes lightweight and non-blocking if the legacy table lags behind.
      });
    }
  } catch (error) {
    console.error("[audit] failed to record audit log:", error);
  }
}
