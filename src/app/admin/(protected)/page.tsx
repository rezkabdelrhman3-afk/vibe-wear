import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/utils";
import Link from "next/link";
export default async function Dashboard() {
  const user = await requireUser();
  if (user.role !== "ADMIN")
    return (
      <>
        <h1>MAKE IT MASHY.</h1>
        <p className="admin-note">
          Your editorial workspace. Shape the products, collections, and
          stories.
        </p>
        <Link href="/admin/content" className="button dark">
          Edit the story ↗︎
        </Link>
      </>
    );
  const [sales, count, recent, site] = await Promise.all([
    db.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
      _count: true,
    }),
    db.order.count(),
    db.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
    db.siteSettings.findUniqueOrThrow({ where: { id: "site" } }),
  ]);
  const low = await db.variant.findMany({
    where: { stock: { lte: site.lowStockThreshold } },
    include: { product: true },
    take: 15,
  });
  const top = await db.$queryRaw<
    { name: string; quantity: bigint }[]
  >`SELECT item->>'name' AS name, SUM((item->>'quantity')::int)::bigint AS quantity FROM "Order", jsonb_array_elements(items::jsonb) AS item WHERE "paymentStatus"='PAID' GROUP BY item->>'name' ORDER BY quantity DESC LIMIT 5`;
  return (
    <>
      <div className="admin-top">
        <div>
          <p className="eyebrow">MASHY / BUSINESS AT A GLANCE</p>
          <h1>THE EVERYDAY, IN NUMBERS.</h1>
        </div>
        <Link href="/" className="underlined">
          View store ↗︎
        </Link>
      </div>
      <div className="metric-grid">
        {[
          ["Paid revenue", money(sales._sum.total || 0)],
          ["All orders", String(count)],
          [
            "Paid average order",
            money(
              sales._count
                ? Math.round((sales._sum.total || 0) / sales._count)
                : 0,
            ),
          ],
          ["Low-stock variants", String(low.length)],
        ].map(([label, value]) => (
          <div key={label} className="metric">
            <p>{label}</p>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className="admin-note">
        Metrics include test orders in demo mode. Conversion metrics require a
        consented analytics integration and are not estimated.
      </p>
      <section className="admin-section">
        <h2>Recent orders</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`}>{o.number}</Link>
                  </td>
                  <td>{o.customer.name}</td>
                  <td>{money(o.total)}</td>
                  <td>{o.paymentStatus}</td>
                  <td>{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!recent.length && (
          <p className="admin-note">
            A clean start. Your first order will appear here.
          </p>
        )}
      </section>
      <section className="admin-section">
        <h2>Low stock</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Variant</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              {low.map((v) => (
                <tr key={v.id}>
                  <td>{v.product.name}</td>
                  <td>
                    {v.color} / {v.size}
                  </td>
                  <td>{v.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="admin-section">
        <h2>Top products / paid orders</h2>
        {top.length ? (
          top.map((p) => (
            <p key={p.name} className="admin-note">
              {p.name} — {String(p.quantity)} units
            </p>
          ))
        ) : (
          <p className="admin-note">Sales will tell the story here.</p>
        )}
      </section>
    </>
  );
}
