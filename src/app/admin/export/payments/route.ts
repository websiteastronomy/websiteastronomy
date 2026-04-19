import { getFinanceExportPayloads } from "@/app/actions/finance";
import { downloadResponse, recordAdminExportAction, toCsv } from "@/lib/admin-export";

export async function GET() {
  await recordAdminExportAction("payments");
  const payload = await getFinanceExportPayloads();
  return downloadResponse(toCsv(payload.payments as Array<Record<string, unknown>>), "payments.csv", "text/csv; charset=utf-8");
}
