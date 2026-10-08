import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import { money } from "@/lib/utils";
import { OrderActions } from "@/components/admin-ui";
import { OrderItem } from "@/domain/checkout";
import Link from "next/link";
export default async function AdminOrder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser(true);
  const { id } = await params;
  const o = await db.order.findUnique({
    where: { id },
    include: { customer: true, events: { orderBy: { createdAt: "desc" } } },
  });
  if (!o) notFound();
  const address = o.address as Record<string, string>;
  return (
    <>
      <div className="admin-top">
        <div>
          <p className="eyebrow">ORDER DETAIL</p>
          <h1>{o.number}</h1>
          <p>
            {o.status} / Payment {o.paymentStatus} / {o.paymentMethod}
          </p>
        </div>
        <Link className="underlined" href="/admin/orders">
          All orders ↗︎
        </Link>
      </div>
      <div className="admin-order-grid">
        <div>
          <h2>The essentials</h2>
          {(o.items as unknown as OrderItem[]).map((i) => (
            <p className="row admin-note" key={i.variantId}>
              <span>
                {i.name} · {i.color} / {i.size} × {i.quantity}
              </span>
              <span>{money(i.price * i.quantity)}</span>
            </p>
          ))}
          <p className="row admin-note">
            <span>Shipping / Discount</span>
            <span>
              {money(o.shipping)} / −{money(o.discount)}
            </span>
          </p>
          <p className="row">
            <strong>Total</strong>
            <strong>{money(o.total)}</strong>
          </p>
          <section className="admin-section">
            <h2>Delivery details</h2>
            {Object.entries(address).map(
              ([key, value]) =>
                value && (
                  <p key={key}>
                    <strong>{key}: </strong>
                    {value}
                  </p>
                ),
            )}
            <p>{o.customer.email}</p>
            <p className="admin-note">
              Private tracking:{" "}
              <Link href={`/orders/${o.accessToken}`}>
                Open customer summary ↗︎
              </Link>
            </p>
          </section>
        </div>
        <div>
          <h2>Order timeline</h2>
          <ol className="order-timeline">
            {o.events.map((e) => (
              <li key={e.id}>
                <span>
                  {e.status} {e.internal ? "· INTERNAL" : ""}
                </span>
                <p>{e.note}</p>
                <small>{e.createdAt.toISOString()}</small>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <OrderActions
        id={o.id}
        csrf={user.csrf}
        status={o.status}
        paymentMethod={o.paymentMethod}
        paymentStatus={o.paymentStatus}
      />
    </>
  );
}
