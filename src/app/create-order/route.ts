import { createPaymentOrderAction } from "@/app/actions/finance";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createPaymentOrderAction({
    amount: Number(body.amount || 0),
    type: body.type,
    referenceId: body.reference_id || body.referenceId || null,
    metadata: body.metadata || {},
  });
  return Response.json(result);
}
