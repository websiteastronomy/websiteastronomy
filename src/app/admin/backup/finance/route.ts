import { getFinanceBackupPayload } from "@/app/actions/finance";
import { downloadResponse, recordAdminExportAction } from "@/lib/admin-export";

export async function GET() {
  await recordAdminExportAction("finance_backup");
  return downloadResponse(JSON.stringify(await getFinanceBackupPayload(), null, 2), "finance-backup.json", "application/json; charset=utf-8");
}
