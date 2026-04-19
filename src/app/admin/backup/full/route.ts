import {
  downloadResponse,
  getFullBackupPayload,
  recordAdminExportAction,
  requireAdminExportAccess,
} from "@/lib/admin-export";

export async function GET() {
  await requireAdminExportAccess();
  await recordAdminExportAction("full_backup");
  return downloadResponse(
    JSON.stringify(await getFullBackupPayload(), null, 2),
    "full-system-backup.json",
    "application/json; charset=utf-8"
  );
}
