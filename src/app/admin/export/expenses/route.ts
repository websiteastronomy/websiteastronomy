import { getFinanceExportPayloads } from "@/app/actions/finance";
import { downloadResponse, recordAdminExportAction, toCsv } from "@/lib/admin-export";

export async function GET() {
  await recordAdminExportAction("expenses");
  const payload = await getFinanceExportPayloads();
  return downloadResponse(toCsv(payload.expenses as Array<Record<string, unknown>>), "expenses.csv", "text/csv; charset=utf-8");
}
