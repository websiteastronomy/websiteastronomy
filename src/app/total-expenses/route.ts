import { getFinanceSummaryAction } from "@/app/actions/finance";

export async function GET() {
  const summary = await getFinanceSummaryAction();
  return Response.json({ totalExpenses: summary.totalExpenses });
}
