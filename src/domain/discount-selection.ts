import type { Prisma } from "@prisma/client";
import { calculateDiscount } from "./discounts";
export async function selectDiscount(
  client: Pick<Prisma.TransactionClient, "discount" | "order">,
  subtotal: number,
  code: string,
  email?: string,
) {
  if (code) {
    const rule = await client.discount.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!rule) throw new Error("Discount code not found.");
    calculateDiscount(subtotal, rule);
    if (
      rule.singleUse &&
      email &&
      (await client.order.count({
        where: {
          customer: { email },
          discountCode: rule.code,
          inventoryReleased: false,
        },
      }))
    )
      throw new Error("This code has already been used.");
    return rule;
  }
  const candidates = await client.discount.findMany({
    where: {
      automatic: true,
      active: true,
      minimum: { lte: subtotal },
      startsAt: { lte: new Date() },
      OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
    },
  });
  let best: (typeof candidates)[number] | null = null;
  let saving = 0;
  for (const rule of candidates) {
    if (rule.usageLimit !== null && rule.used >= rule.usageLimit) continue;
    if (
      rule.singleUse &&
      email &&
      (await client.order.count({
        where: {
          customer: { email },
          discountCode: rule.code,
          inventoryReleased: false,
        },
      }))
    )
      continue;
    const amount = calculateDiscount(subtotal, rule);
    if (amount > saving) {
      best = rule;
      saving = amount;
    }
  }
  return best;
}
