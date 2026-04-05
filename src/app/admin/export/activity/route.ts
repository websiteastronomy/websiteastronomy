import {
  downloadResponse,
  getActivityExportRows,
  requireAdminExportAccess,
  toCsv,
} from "@/lib/admin-export";

export async function GET() {
  await requireAdminExportAccess();
  const csv = toCsv(await getActivityExportRows());
  return downloadResponse(csv, "activity-logs.csv", "text/csv; charset=utf-8");
}
