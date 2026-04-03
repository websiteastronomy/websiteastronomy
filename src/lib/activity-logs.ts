import { headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import { activity_logs } from "@/db/schema";

type LogActivityInput = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  role?: string | null;
  ipAddress?: string | null;
};

export async function logActivity(input: LogActivityInput) {
  try {
    const headerStore = await headers().catch(() => null);
    const forwardedFor = headerStore?.get("x-forwarded-for") || null;
    const realIp = headerStore?.get("x-real-ip") || null;
    const ipAddress = input.ipAddress || forwardedFor?.split(",")[0]?.trim() || realIp || null;

    await db.insert(activity_logs).values({
      id: uuidv4(),
      userId: input.userId || null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId || null,
      details: input.details || {},
      timestamp: new Date(),
      ipAddress,
      role: input.role || null,
    });
  } catch (error) {
    console.error("[activity-logs] failed to record activity:", error);
  }
}
