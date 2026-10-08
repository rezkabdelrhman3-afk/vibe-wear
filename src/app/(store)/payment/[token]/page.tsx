import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { isDemo, money } from "@/lib/utils";
import { MockPayment } from "@/components/order-client";
export const metadata = {
  title: "Sandbox payment",
  robots: { index: false, follow: false },
};
export default async function Payment({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  if (!isDemo() || process.env.PAYMENT_PROVIDER === "paymob") notFound();
  const { token } = await params;
  const order = await db.order.findUnique({ where: { accessToken: token } });
  if (!order || order.paymentMethod === "COD") notFound();
  return (
    <main id="main" className="narrow-page">
      <p className="eyebrow">MASHY / SAFE PAYMENT SANDBOX</p>
      <h1>A TEST RUN.</h1>
      <p>No card or wallet details are collected. No money moves.</p>
      <p>
        Order {order.number} · {money(order.total)}
      </p>
      <MockPayment token={token} />
    </main>
  );
}
