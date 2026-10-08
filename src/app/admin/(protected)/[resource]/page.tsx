import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  resources,
  editorResources,
  fields,
  type EditableResource,
} from "@/domain/admin";
import { notFound } from "next/navigation";
import { ResourceEditor, MediaUploader } from "@/components/admin-ui";
import Link from "next/link";
export default async function Resource({
  params,
  searchParams,
}: {
  params: Promise<{ resource: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { resource } = await params;
  if (!resources.includes(resource as (typeof resources)[number])) notFound();
  const user = await requireUser(!editorResources.includes(resource));
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const take = 100,
    skip = (page - 1) * take;
  let records: unknown[] = [];
  let columns: string[] = [];
  switch (resource) {
    case "products":
      records = await db.product.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
      });
      columns = ["name", "slug", "price", "status", "id"];
      break;
    case "variants":
      records = await db.variant.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
      });
      columns = ["sku", "color", "size", "stock", "productId"];
      break;
    case "collections":
      records = await db.collection.findMany({ skip, take });
      columns = ["name", "slug", "id"];
      break;
    case "discounts":
      records = await db.discount.findMany({ skip, take });
      columns = ["code", "type", "value", "used", "active"];
      break;
    case "shipping":
      records = await db.shippingRate.findMany({
        orderBy: { governorate: "asc" },
      });
      columns = ["governorate", "price", "active"];
      break;
    case "content":
      records = await db.content.findMany({
        skip,
        take,
        orderBy: { key: "asc" },
      });
      columns = ["key", "title", "updatedAt"];
      break;
    case "settings":
      records = [
        await db.siteSettings.findUniqueOrThrow({ where: { id: "site" } }),
      ];
      break;
    case "customers":
      records = await db.customer.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
      });
      columns = ["name", "email", "phone", "createdAt"];
      break;
    case "orders":
      records = await db.order.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
        },
      });
      columns = ["number", "total", "status", "paymentStatus", "createdAt"];
      break;
    case "inquiries":
      records = await db.inquiry.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
      });
      columns = ["name", "email", "message", "createdAt"];
      break;
    case "audit":
      records = await db.auditLog.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
      });
      columns = ["actorId", "action", "resource", "resourceId", "createdAt"];
      break;
    case "media":
      records = await db.media.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
      });
      columns = ["url", "alt", "type"];
      break;
  }
  const data = JSON.parse(JSON.stringify(records)) as Record<string, unknown>[];
  return (
    <>
      <div className="admin-top">
        <div>
          <p className="eyebrow">MASHY / THE WORKSPACE</p>
          <h1>{resource.toUpperCase()}</h1>
        </div>
        <Link href="/admin" className="underlined">
          Overview ↗︎
        </Link>
      </div>
      {["products", "variants", "discounts", "shipping", "settings"].includes(
        resource,
      ) && (
        <p className="admin-note">
          Money is stored in piasters: 22,000 = 220 EGP. Archive products to
          preserve order history. IDs link products, variants, and collections.
        </p>
      )}
      {resource === "content" && (
        <p className="admin-note">
          Edit hero, philosophy, chapter, story, footer, faq-*, or campaign-*
          sections. Add policy-privacy, policy-terms, or policy-shipping-returns
          to replace the pre-launch policy drafts. Images must be local media
          paths or HTTPS URLs.
        </p>
      )}
      {resource in fields ? (
        <ResourceEditor
          resource={resource as EditableResource}
          records={data}
          columns={columns}
          csrf={user.csrf}
        />
      ) : (
        <>
          {resource === "media" && <MediaUploader csrf={user.csrf} />}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((record) => (
                  <tr key={String(record.id)}>
                    {columns.map((c) => (
                      <td
                        key={c}
                        style={
                          c === "message"
                            ? { whiteSpace: "pre-wrap", minWidth: 300 }
                            : undefined
                        }
                      >
                        {resource === "orders" && c === "number" ? (
                          <Link href={`/admin/orders/${record.id}`}>
                            {String(record[c])}
                          </Link>
                        ) : (
                          String(record[c] ?? "—")
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {!["settings", "shipping"].includes(resource) && (
        <div className="admin-actions">
          {page > 1 && (
            <Link className="underlined" href={`?page=${page - 1}`}>
              ← Previous
            </Link>
          )}
          <span className="admin-note">Page {page} · Up to 100 records</span>
          {records.length === 100 && (
            <Link className="underlined" href={`?page=${page + 1}`}>
              Next →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
