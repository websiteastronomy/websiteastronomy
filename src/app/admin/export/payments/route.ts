import { getFinanceExportPayloads } from "@/app/actions/finance";
import { downloadResponse, toCsv } from "@/lib/admin-export";

export async function GET() {
  const payload = await getFinanceExportPayloads();
  return downloadResponse(toCsv(payload.payments as Array<Record<string, unknown>>), "payments.csv", "text/csv; charset=utf-8");
}
