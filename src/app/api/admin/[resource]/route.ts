import { db } from "@/lib/db";
import { verifyAdminRequest } from "@/lib/auth";
import { errorResponse, readJson } from "@/lib/http";
import {
  adminSchemas,
  editorResources,
  type EditableResource,
} from "@/domain/admin";
import { z } from "zod";
import { releaseOrder } from "@/domain/checkout";
import { queueOrderEmail } from "@/integrations/email";
const transitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  RETURNED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};
export async function POST(
  req: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    const { resource } = await params;
    const user = await verifyAdminRequest(
      req,
      !editorResources.includes(resource),
    );
    const body = await readJson(req);
    const id = typeof body.id === "string" ? body.id : undefined;
    if (resource === "orders") {
      const input = z
        .object({
          id: z.string(),
          status: z.string().optional(),
          note: z.string().max(2000).optional(),
          internal: z.boolean().default(true),
          paymentStatus: z.enum(["PAID", "REFUNDED"]).optional(),
        })
        .parse(body);
      const order = await db.order.findUniqueOrThrow({
        where: { id: input.id },
        include: { customer: true },
      });
      if (
        input.status &&
        input.status !== order.status &&
        !transitions[order.status]?.includes(input.status)
      )
        throw new Error("Invalid order status transition");
      if (input.status === "CANCELLED") {
        if (order.paymentStatus === "PAID")
          throw new Error(
            "Paid orders require a provider refund and manual reconciliation before cancellation",
          );
        await releaseOrder(order.id);
      } else {
        await db.$transaction(async (tx) => {
          if (
            input.status === "PREPARING" &&
            order.paymentMethod !== "COD" &&
            order.paymentStatus !== "PAID"
          )
            throw new Error("Payment confirmation required before preparing");
          if (input.paymentStatus === "PAID" && order.paymentMethod !== "COD")
            throw new Error(
              "Online payment confirmation must come from the provider",
            );
          if (
            input.paymentStatus === "PAID" &&
            !["SHIPPED", "DELIVERED"].includes(order.status)
          )
            throw new Error(
              "COD collection can only be recorded after shipping",
            );
          if (input.paymentStatus === "REFUNDED" && order.status !== "RETURNED")
            throw new Error(
              "Refund status requires a returned order and external refund confirmation",
            );
          if (
            input.status === "REFUNDED" &&
            order.paymentStatus !== "REFUNDED" &&
            input.paymentStatus !== "REFUNDED"
          )
            throw new Error("Confirm the external refund first");
          const updated = await tx.order.updateMany({
            where: {
              id: order.id,
              status: order.status,
              paymentStatus: order.paymentStatus,
            },
            data: {
              status: input.status || order.status,
              paymentStatus: input.paymentStatus || order.paymentStatus,
            },
          });
          if (!updated.count)
            throw new Error("Order changed; refresh before updating");
          if (input.status && input.status !== order.status)
            await tx.orderEvent.create({
              data: {
                orderId: order.id,
                status: input.status,
                note: `Order ${input.status.toLowerCase()}.`,
                internal: false,
              },
            });
          if (input.paymentStatus)
            await tx.orderEvent.create({
              data: {
                orderId: order.id,
                status: input.paymentStatus,
                note: "Payment status manually reconciled by staff.",
                internal: true,
              },
            });
        });
      }
      if (input.note)
        await db.orderEvent.create({
          data: {
            orderId: order.id,
            status: input.status || order.status,
            note: input.note,
            internal: input.internal,
          },
        });
      if (
        input.status &&
        ["SHIPPED", "DELIVERED", "CANCELLED"].includes(input.status)
      )
        await queueOrderEmail(
          order.customer.email,
          order.number,
          order.total,
          input.status.toLowerCase(),
        );
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "UPDATE",
          resource,
          resourceId: order.id,
        },
      });
      return Response.json({ ok: true });
    }
    if (!(resource in adminSchemas)) return new Response(null, { status: 404 });
    const data = adminSchemas[resource as EditableResource].parse(body);
    let result: { id: string };
    switch (resource) {
      case "products": {
        const d = adminSchemas.products.parse(data);
        result = id
          ? await db.product.update({ where: { id }, data: d })
          : await db.product.create({ data: d });
        break;
      }
      case "variants": {
        const d = adminSchemas.variants.parse(data);
        result = id
          ? await db.variant.update({ where: { id }, data: d })
          : await db.variant.create({ data: d });
        break;
      }
      case "collections": {
        const d = adminSchemas.collections.parse(data);
        result = id
          ? await db.collection.update({ where: { id }, data: d })
          : await db.collection.create({ data: d });
        break;
      }
      case "discounts": {
        const d = adminSchemas.discounts.parse(data);
        result = id
          ? await db.discount.update({ where: { id }, data: d })
          : await db.discount.create({ data: d });
        break;
      }
      case "shipping": {
        const d = adminSchemas.shipping.parse(data);
        result = id
          ? await db.shippingRate.update({ where: { id }, data: d })
          : await db.shippingRate.create({ data: d });
        break;
      }
      case "content": {
        const d = adminSchemas.content.parse(data);
        result = id
          ? await db.content.update({ where: { id }, data: d })
          : await db.content.create({ data: d });
        break;
      }
      case "settings":
        result = await db.siteSettings.update({
          where: { id: "site" },
          data: adminSchemas.settings.parse(data),
        });
        break;
      default:
        return new Response(null, { status: 404 });
    }
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: id ? "UPDATE" : "CREATE",
        resource,
        resourceId: result.id,
      },
    });
    return Response.json({ ok: true, id: result.id });
  } catch (e) {
    return errorResponse(e);
  }
}
