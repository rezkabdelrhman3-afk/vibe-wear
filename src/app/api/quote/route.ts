import { selectDiscount } from "@/domain/discount-selection";
import { z } from "zod";
import { db } from "@/lib/db";
import { calculateDiscount } from "@/domain/discounts";
import { errorResponse, readJson } from "@/lib/http";
import { verifyOrigin, rateLimit, clientKey } from "@/lib/auth";
const schema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(30),
  governorate: z.string(),
  code: z.string().max(50),
});
export async function POST(req: Request) {
  try {
    verifyOrigin(req);
    await rateLimit(`quote:${clientKey(req)}`, 120);
    const input = schema.parse(await readJson(req));
    const variants = await db.variant.findMany({
      where: { id: { in: input.items.map((i) => i.variantId) } },
      include: { product: true },
    });
    let subtotal = 0;
    for (const item of input.items) {
      const v = variants.find((v) => v.id === item.variantId);
      if (!v || v.product.status !== "ACTIVE")
        throw new Error("Product not available");
      if (v.stock < item.quantity)
        throw new Error(`${v.product.name} has insufficient stock`);
      subtotal += (v.price ?? v.product.price) * item.quantity;
    }
    const rule = await selectDiscount(db, subtotal, input.code);
    const discount = calculateDiscount(subtotal, rule);
    const rate = await db.shippingRate.findUnique({
      where: { governorate: input.governorate },
    });
    const settings = await db.siteSettings.findUniqueOrThrow({
      where: { id: "site" },
    });
    const shipping =
      subtotal - discount >= settings.freeShippingThreshold
        ? 0
        : (rate?.price ?? 0);
    return Response.json({
      subtotal,
      discount,
      shipping,
      total: subtotal - discount + shipping,
      code: rule?.code || "",
    });
  } catch (e) {
    return errorResponse(e);
  }
}
