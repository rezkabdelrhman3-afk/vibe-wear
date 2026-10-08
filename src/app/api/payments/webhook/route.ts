import { db } from "@/lib/db";
import {
  paymobCanonical,
  verifySignature,
  settlePayment,
} from "@/integrations/payments";
export async function POST(req: Request) {
  try {
    if (process.env.PAYMENT_PROVIDER !== "paymob")
      return new Response(null, { status: 404 });
    const body = await req.json();
    const o = body.obj;
    if (
      !o ||
      !verifySignature(
        paymobCanonical(o),
        new URL(req.url).searchParams.get("hmac") || "",
        process.env.PAYMOB_HMAC_SECRET || "",
        "sha512",
      )
    )
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    if (o.pending === true) return Response.json({ received: true });
    if (o.is_refunded || o.is_voided)
      return Response.json(
        { error: "Refund or void requires reconciliation" },
        { status: 409 },
      );
    const orderId = o.order?.merchant_order_id;
    if (typeof orderId !== "string")
      return Response.json(
        { error: "Order reference required" },
        { status: 400 },
      );
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return new Response(null, { status: 404 });
    await settlePayment(
      order.id,
      `paymob_${o.id}`,
      Number(o.amount_cents),
      o.currency,
      o.success === true,
      "paymob",
    );
    return Response.json({ received: true });
  } catch {
    return Response.json(
      { error: "Payment reconciliation failed; retry or review required" },
      { status: 409 },
    );
  }
}
