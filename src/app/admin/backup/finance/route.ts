import { getFinanceBackupPayload } from "@/app/actions/finance";
import { downloadResponse } from "@/lib/admin-export";

export async function GET() {
  return downloadResponse(JSON.stringify(await getFinanceBackupPayload(), null, 2), "finance-backup.json", "application/json; charset=utf-8");
}
