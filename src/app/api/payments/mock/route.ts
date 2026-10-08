import { z } from "zod";
import { db } from "@/lib/db";
import { isDemo } from "@/lib/utils";
import { verifyOrigin, rateLimit, clientKey } from "@/lib/auth";
import { errorResponse, readJson } from "@/lib/http";
import { settlePayment } from "@/integrations/payments";
export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    if (!isDemo() || process.env.PAYMENT_PROVIDER === "paymob")
      return new Response(null, { status: 404 });
    await rateLimit(`mock:${clientKey(req)}`, 30);
    const { token, success } = z
      .object({ token: z.string().length(64), success: z.boolean() })
      .parse(await readJson(req));
    const order = await db.order.findUniqueOrThrow({
      where: { accessToken: token },
    });
    if (order.paymentMethod === "COD")
      throw new Error("Invalid payment method");
    await settlePayment(
      order.id,
      `mock_${order.id}`,
      order.total,
      order.currency,
      success,
      "mock",
    );
    return Response.json({ url: `/orders/${token}` });
  } catch (e) {
    return errorResponse(e);
  }
}
