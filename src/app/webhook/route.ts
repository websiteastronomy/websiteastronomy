import { processCapturedPaymentAction, verifyWebhookSignatureAction } from "@/app/actions/finance";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const verified = await verifyWebhookSignatureAction(rawBody, signature);

  if (!verified) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody) as {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          method?: string;
        };
      };
    };
  };

  if (payload.event !== "payment.captured") {
    return Response.json({ ok: true, ignored: true });
  }

  const payment = payload.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id) {
    return new Response("Missing payment payload", { status: 400 });
  }

  const result = await processCapturedPaymentAction({
    razorpayOrderId: payment.order_id,
    razorpayPaymentId: payment.id,
    paymentMethod: payment.method || null,
  });

  return Response.json({ ok: true, ...result });
}
