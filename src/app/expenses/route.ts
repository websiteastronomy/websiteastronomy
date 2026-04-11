import { getExpensesAction } from "@/app/actions/finance";

export async function GET() {
  return Response.json(await getExpensesAction());
}
