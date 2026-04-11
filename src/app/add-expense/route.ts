import { addExpenseAction } from "@/app/actions/finance";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await addExpenseAction({
    title: body.title,
    amount: Number(body.amount || 0),
    category: body.category,
    projectId: body.project_id || body.projectId || null,
    paidTo: body.paid_to || body.paidTo,
    receiptUrl: body.receipt_url || body.receiptUrl,
  });

  return Response.json(result);
}
