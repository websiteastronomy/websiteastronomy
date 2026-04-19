import {
  downloadResponse,
  getActivityExportRows,
  recordAdminExportAction,
  requireAdminExportAccess,
  toCsv,
} from "@/lib/admin-export";

export async function GET() {
  await requireAdminExportAccess();
  await recordAdminExportAction("activity");
  const csv = toCsv(await getActivityExportRows());
  return downloadResponse(csv, "activity-logs.csv", "text/csv; charset=utf-8");
}
