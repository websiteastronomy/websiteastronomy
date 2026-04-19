import { getFinanceExportPayloads } from "@/app/actions/finance";
import { downloadResponse, recordAdminExportAction, toCsv } from "@/lib/admin-export";

export async function GET() {
  await recordAdminExportAction("finance_activity");
  const payload = await getFinanceExportPayloads();
  return downloadResponse(toCsv(payload.activity), "finance-activity.csv", "text/csv; charset=utf-8");
}
