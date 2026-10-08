import { checkoutSchema, createOrder, releaseOrder } from "@/domain/checkout";
import { verifyOrigin, rateLimit, clientKey } from "@/lib/auth";
import { errorResponse, readJson } from "@/lib/http";
import { paymentProvider } from "@/integrations/payments";
import { queueOrderEmail } from "@/integrations/email";
import { db } from "@/lib/db";
export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    await rateLimit(`checkout:${clientKey(req)}`, 30, 600);
    const input = checkoutSchema.parse(await readJson(req));
    const order = await createOrder(input);
    if (order.status === "CANCELLED")
      throw new Error("This checkout was cancelled. Please refresh your bag.");
    let url = `/orders/${order.accessToken}`;
    if (order.paymentMethod !== "COD" && order.paymentStatus === "PENDING") {
      try {
        const session = await paymentProvider().createSession(order);
        url = session.url;
        await db.order.update({
          where: { id: order.id },
          data: { paymentReference: session.reference },
        });
      } catch (e) {
        await releaseOrder(order.id);
        throw e;
      }
    }
    const existing = await db.emailOutbox.findFirst({
      where: { subject: { contains: order.number } },
    });
    if (!existing)
      await queueOrderEmail(input.email, order.number, order.total, "received");
    return Response.json({ url, number: order.number });
  } catch (e) {
    return errorResponse(e);
  }
}
