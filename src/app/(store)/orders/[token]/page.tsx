import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { money, isDemo } from "@/lib/utils";
import { OrderReceipt } from "@/components/order-client";
import { OrderItem } from "@/domain/checkout";
import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";
export const metadata = {
  title: "Your order",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function Order({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await db.order.findUnique({
    where: { accessToken: token },
    include: {
      events: { where: { internal: false }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();
  const accepted =
    order.status !== "CANCELLED" &&
    (order.paymentMethod === "COD" || order.paymentStatus === "PAID");
  return (
    <main id="main" className="receipt-page">
      <OrderReceipt id={order.number} total={order.total} clear={accepted} />
      <div className="receipt-heading">
        <span className="receipt-check">
          <Check size={24} />
        </span>
        <p className="eyebrow">{order.number}</p>
        <h1>
          {accepted
            ? "YOUR NEXT\nCHAPTER."
            : order.status === "CANCELLED"
              ? "PLANS CHANGED."
              : "ONE MORE STEP."}
        </h1>
        <p>
          {accepted
            ? "Order received. Thanks for making us part of your everyday."
            : order.status === "CANCELLED"
              ? "This order was cancelled. Your payment was not completed."
              : "Your order is waiting for payment confirmation."}
        </p>
        {isDemo() && (
          <p className="demo-notice">TEST ORDER / No goods will be shipped.</p>
        )}
      </div>
      <div className="receipt-details">
        <div className="row">
          <span>Order status</span>
          <strong>{order.status}</strong>
        </div>
        <div className="row">
          <span>Payment</span>
          <span>
            {order.paymentMethod} / {order.paymentStatus}
          </span>
        </div>
        {(order.items as unknown as OrderItem[]).map((i) => (
          <div className="row" key={i.variantId}>
            <span>
              {i.name}
              <small>
                {i.color} / {i.size} × {i.quantity}
              </small>
            </span>
            <span>{money(i.price * i.quantity)}</span>
          </div>
        ))}
        <div className="row">
          <span>Shipping</span>
          <span>{money(order.shipping)}</span>
        </div>
        {order.discount > 0 && (
          <div className="row">
            <span>Discount</span>
            <span>−{money(order.discount)}</span>
          </div>
        )}
        <div className="row receipt-total">
          <strong>Total</strong>
          <strong>{money(order.total)}</strong>
        </div>
        <h2>The journey so far</h2>
        <ol className="order-timeline">
          {order.events.map((e) => (
            <li key={e.id}>
              <span>{e.status}</span>
              <p>{e.note}</p>
              <small>
                {e.createdAt.toLocaleString("en-GB", {
                  timeZone: "Africa/Cairo",
                })}{" "}
                · Cairo
              </small>
            </li>
          ))}
        </ol>
        <p className="privacy-note">
          Keep this private link to track your order. Anyone with this link can
          view this order summary.
        </p>
        <Link href="/shop" className="button dark full">
          Keep exploring <ArrowUpRight size={17} />
        </Link>
      </div>
    </main>
  );
}
