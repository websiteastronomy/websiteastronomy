import { writeAuditLog } from "@/lib/audit";

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
  await writeAuditLog({
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId || null,
    performedBy: input.userId || null,
    metadata: input.details || {},
    ipAddress: input.ipAddress || null,
    role: input.role || null,
  });
}
