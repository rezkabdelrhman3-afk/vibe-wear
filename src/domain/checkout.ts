import { selectDiscount } from "./discount-selection";
import { z } from "zod";
import { randomBytes, createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { calculateDiscount } from "./discounts";
export const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(30),
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .regex(/^(?:\+20|0)1[0125]\d{8}$/, "Enter an Egyptian mobile number"),
  governorate: z.string().max(60),
  city: z.string().trim().min(2).max(100),
  street: z.string().trim().min(3).max(200),
  building: z.string().trim().min(1).max(30),
  floor: z.string().max(30).default(""),
  apartment: z.string().max(30).default(""),
  landmark: z.string().max(150).default(""),
  notes: z.string().max(500).default(""),
  discountCode: z.string().max(50).default(""),
  paymentMethod: z.enum(["COD", "CARD", "WALLET"]),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderItem = {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
};
export async function createOrder(input: CheckoutInput) {
  const requestHash = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(
        async (tx) => {
          const existing = await tx.order.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
          });
          if (existing) {
            if (existing.requestHash !== requestHash)
              throw new Error(
                "Checkout has changed. Please refresh and try again.",
              );
            return existing;
          }
          const unique = new Set(input.items.map((i) => i.variantId));
          if (unique.size !== input.items.length)
            throw new Error("Duplicate variants in bag");
          const variants = await tx.variant.findMany({
            where: { id: { in: [...unique] } },
            include: { product: true },
          });
          const items: OrderItem[] = [];
          let subtotal = 0;
          for (const item of input.items) {
            const v = variants.find((v) => v.id === item.variantId);
            if (!v || v.product.status !== "ACTIVE")
              throw new Error("A product is no longer available.");
            const price = v.price ?? v.product.price;
            const changed = await tx.variant.updateMany({
              where: { id: v.id, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (changed.count !== 1)
              throw new Error(`${v.product.name} has insufficient stock.`);
            subtotal += price * item.quantity;
            items.push({
              variantId: v.id,
              productId: v.productId,
              name: v.product.name,
              slug: v.product.slug,
              image: v.image || v.product.images[0],
              color: v.color,
              size: v.size,
              quantity: item.quantity,
              price,
            });
          }
          const shippingRate = await tx.shippingRate.findUnique({
            where: { governorate: input.governorate },
          });
          if (!shippingRate?.active)
            throw new Error("Delivery is not available in this governorate.");
          const site = await tx.siteSettings.findUniqueOrThrow({
            where: { id: "site" },
          });
          const rule = await selectDiscount(
            tx,
            subtotal,
            input.discountCode,
            input.email,
          );
          const discount = calculateDiscount(subtotal, rule);
          if (rule)
            await tx.discount.update({
              where: { id: rule.id },
              data: { used: { increment: 1 } },
            });
          const shipping =
            subtotal - discount >= site.freeShippingThreshold
              ? 0
              : shippingRate.price;
          const customer = await tx.customer.upsert({
            where: { email: input.email },
            create: {
              email: input.email,
              name: input.name,
              phone: input.phone,
            },
            update: { name: input.name, phone: input.phone },
          });
          const {
            name,
            phone,
            governorate,
            city,
            street,
            building,
            floor,
            apartment,
            landmark,
            notes,
          } = input;
          return tx.order.create({
            data: {
              number: `M24-${randomBytes(5).toString("hex").toUpperCase()}`,
              accessToken: randomBytes(32).toString("hex"),
              idempotencyKey: input.idempotencyKey,
              requestHash,
              customerId: customer.id,
              address: {
                name,
                phone,
                governorate,
                city,
                street,
                building,
                floor,
                apartment,
                landmark,
                notes,
              },
              items: items as unknown as Prisma.InputJsonValue,
              subtotal,
              shipping,
              discount,
              total: subtotal + shipping - discount,
              discountCode: rule?.code,
              paymentMethod: input.paymentMethod,
              expiresAt:
                input.paymentMethod === "COD"
                  ? null
                  : new Date(Date.now() + 30 * 60 * 1000),
              events: {
                create: { status: "PENDING", note: "Order received." },
              },
            },
          });
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2034", "P2002"].includes(error.code) &&
        attempt < 3
      )
        continue;
      throw error;
    }
  }
  throw new Error("Please retry checkout.");
}
export async function releaseOrder(orderId: string, status = "CANCELLED") {
  return db.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: {
        id: orderId,
        inventoryReleased: false,
        paymentStatus: { not: "PAID" },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      data: { inventoryReleased: true, status, paymentStatus: "FAILED" },
    });
    if (!claimed.count) return false;
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
    for (const item of order.items as unknown as OrderItem[])
      await tx.variant.updateMany({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    if (order.discountCode)
      await tx.discount.updateMany({
        where: { code: order.discountCode, used: { gt: 0 } },
        data: { used: { decrement: 1 } },
      });
    await tx.orderEvent.create({
      data: {
        orderId,
        status,
        note: "Payment cancelled or reservation expired. Stock released.",
      },
    });
    return true;
  });
}
