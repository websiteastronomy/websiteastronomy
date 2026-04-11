import { getFinanceExportPayloads } from "@/app/actions/finance";
import { downloadResponse, toCsv } from "@/lib/admin-export";

export async function GET() {
  const payload = await getFinanceExportPayloads();
  return downloadResponse(toCsv(payload.expenses as Array<Record<string, unknown>>), "expenses.csv", "text/csv; charset=utf-8");
}
