import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "@prisma/client";
import { db } from "@/lib/db";
import { appUrl, isDemo } from "@/lib/utils";
import { releaseOrder } from "@/domain/checkout";
import { queueOrderEmail } from "./email";
export interface PaymentProvider {
  createSession(order: Order): Promise<{ url: string; reference: string }>;
}
class MockProvider implements PaymentProvider {
  async createSession(order: Order) {
    if (!isDemo())
      throw new Error("Mock payments cannot be used for live sales");
    return {
      url: `/payment/${order.accessToken}`,
      reference: `mock_${order.id}`,
    };
  }
}
class PaymobProvider implements PaymentProvider {
  async createSession(order: Order) {
    const key = process.env.PAYMOB_SECRET_KEY;
    const publicKey = process.env.PAYMOB_PUBLIC_KEY;
    const integrations = (process.env.PAYMOB_INTEGRATION_IDS || "")
      .split(",")
      .map(Number)
      .filter((n) => n > 0);
    if (!key || !publicKey || !integrations.length)
      throw new Error("Paymob configuration is incomplete");
    const customer = await db.customer.findUniqueOrThrow({
      where: { id: order.customerId },
    });
    const a = order.address as Record<string, string>;
    const response = await fetch("https://accept.paymob.com/v1/intention/", {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: order.total,
        currency: order.currency,
        payment_methods: integrations,
        special_reference: order.id,
        items: [],
        billing_data: {
          first_name: a.name.split(" ")[0],
          last_name: a.name.split(" ").slice(1).join(" ") || "-",
          email: customer.email,
          phone_number: customer.phone,
          apartment: a.apartment || "NA",
          floor: a.floor || "NA",
          street: a.street,
          building: a.building,
          city: a.city,
          state: a.governorate,
          country: "EG",
        },
        notification_url: `${appUrl()}/api/payments/webhook`,
        redirection_url: `${appUrl()}/orders/${order.accessToken}`,
      }),
    });
    if (!response.ok)
      throw new Error("Payment provider is unavailable. Please try again.");
    const data = await response.json();
    if (typeof data.client_secret !== "string" || !data.id)
      throw new Error("Invalid payment provider response");
    return {
      url: `https://accept.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(data.client_secret)}`,
      reference: String(data.id),
    };
  }
}
export function paymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "paymob"
    ? new PaymobProvider()
    : new MockProvider();
}
export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm = "sha256",
) {
  if (!secret || !signature) return false;
  const expected = createHmac(algorithm, secret).update(payload).digest("hex");
  return (
    /^[a-f0-9]+$/i.test(signature) &&
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(expected), Buffer.from(signature.toLowerCase()))
  );
}
export function paymobCanonical(o: Record<string, unknown>) {
  const fields = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order.id",
    "owner",
    "pending",
    "source_data.pan",
    "source_data.sub_type",
    "source_data.type",
    "success",
  ];
  return fields
    .map((path) =>
      path
        .split(".")
        .reduce<unknown>((v, k) => (v as Record<string, unknown>)?.[k], o),
    )
    .join("");
}
export async function settlePayment(
  orderId: string,
  eventId: string,
  amount: number,
  currency: string,
  success: boolean,
  provider: string,
) {
  const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });
  if (amount !== order.total || currency !== order.currency)
    throw new Error("Payment amount or currency mismatch");
  if (!success) {
    await releaseOrder(orderId);
    return;
  }
  const changed = await db.$transaction(async (tx) => {
    if (await tx.payment.findUnique({ where: { providerEventId: eventId } }))
      return false;
    const claimed = await tx.order.updateMany({
      where: {
        id: orderId,
        paymentStatus: "PENDING",
        inventoryReleased: false,
      },
      data: { paymentStatus: "PAID", status: "CONFIRMED", expiresAt: null },
    });
    if (!claimed.count) {
      if (order.inventoryReleased)
        throw new Error(
          "Payment arrived after stock release; manual refund review required",
        );
      return false;
    }
    await tx.payment.create({
      data: {
        orderId,
        provider,
        providerEventId: eventId,
        status: "PAID",
        amount,
      },
    });
    await tx.orderEvent.create({
      data: { orderId, status: "CONFIRMED", note: "Payment confirmed." },
    });
    return true;
  });
  if (changed) {
    const customer = await db.customer.findUniqueOrThrow({
      where: { id: order.customerId },
    });
    await queueOrderEmail(customer.email, order.number, order.total, "paid");
  }
}
