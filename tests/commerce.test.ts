import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID, createHmac } from "node:crypto";
import { db } from "@/lib/db";
import { createOrder, releaseOrder, checkoutSchema } from "@/domain/checkout";
import { calculateDiscount } from "@/domain/discounts";
import { settlePayment, verifySignature } from "@/integrations/payments";
const suffix = randomUUID().slice(0, 8).toUpperCase();
let productId: string;
let variantId: string;
let collectionId: string;
const ids: string[] = [];
const emails: string[] = [];
const rule = {
  type: "PERCENT",
  value: 10,
  minimum: 1000,
  startsAt: new Date(0),
  endsAt: null,
  usageLimit: 2,
  used: 0,
  active: true,
};
function input(overrides: Record<string, unknown> = {}) {
  const email = `test-${randomUUID()}@example.test`;
  emails.push(email);
  return checkoutSchema.parse({
    idempotencyKey: randomUUID(),
    items: [{ variantId, quantity: 1 }],
    email,
    name: "Test Customer",
    phone: "01012345678",
    governorate: "Cairo",
    city: "Cairo",
    street: "Test street",
    building: "1",
    paymentMethod: "CARD",
    ...overrides,
  });
}
async function order(overrides: Record<string, unknown> = {}) {
  const result = await createOrder(input(overrides));
  ids.push(result.id);
  return result;
}
beforeAll(async () => {
  const c = await db.collection.create({
    data: { name: "Test", slug: `test-${suffix}` },
  });
  collectionId = c.id;
  const p = await db.product.create({
    data: {
      name: "Integration fixture",
      slug: `test-${suffix}`,
      price: 22000,
      description: "Test only",
      features: [],
      images: ["/media/cream.jpg"],
      status: "ACTIVE",
      collectionId,
      variants: {
        create: { sku: `TEST-${suffix}`, color: "Test", size: "M", stock: 20 },
      },
    },
    include: { variants: true },
  });
  productId = p.id;
  variantId = p.variants[0].id;
});
afterAll(async () => {
  await db.payment.deleteMany({ where: { orderId: { in: ids } } });
  await db.order.deleteMany({ where: { id: { in: ids } } });
  await db.emailOutbox.deleteMany({ where: { to: { in: emails } } });
  await db.customer.deleteMany({ where: { email: { in: emails } } });
  await db.product.delete({ where: { id: productId } });
  await db.collection.delete({ where: { id: collectionId } });
  await db.discount.deleteMany({
    where: { code: { startsWith: `TEST-${suffix}` } },
  });
  await db.$disconnect();
});
describe("discounts", () => {
  it("calculates integer percentage and caps fixed discounts", () => {
    expect(calculateDiscount(22001, rule)).toBe(2200);
    expect(
      calculateDiscount(22000, { ...rule, type: "FIXED", value: 50000 }),
    ).toBe(22000);
  });
  it("enforces dates, limits, minimums and active state", () => {
    for (const r of [
      { ...rule, used: 2 },
      { ...rule, active: false },
      { ...rule, endsAt: new Date(0) },
      { ...rule, minimum: 50000 },
      { ...rule, startsAt: new Date(Date.now() + 60000) },
    ])
      expect(() => calculateDiscount(22000, r)).toThrow();
  });
});
describe("checkout and stock", () => {
  it("loads relational products and variants", async () => {
    const p = await db.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });
    expect(p?.variants[0].sku).toBe(`TEST-${suffix}`);
  });
  it("calculates totals from server prices and reserves stock", async () => {
    const before = await db.variant.findUniqueOrThrow({
      where: { id: variantId },
    });
    const o = await order();
    expect(o.subtotal).toBe(22000);
    expect(o.total).toBe(28000);
    expect(
      (await db.variant.findUniqueOrThrow({ where: { id: variantId } })).stock,
    ).toBe(before.stock - 1);
  });
  it("idempotent retries return the same order and reject changed contents", async () => {
    const i = input();
    const a = await createOrder(i);
    ids.push(a.id);
    const b = await createOrder(i);
    expect(a.id).toBe(b.id);
    await expect(createOrder({ ...i, city: "Giza" })).rejects.toThrow(
      "changed",
    );
  });
  it("prevents concurrent overselling", async () => {
    await db.variant.update({ where: { id: variantId }, data: { stock: 1 } });
    const results = await Promise.allSettled([
      createOrder(input()),
      createOrder(input()),
    ]);
    const success = results.filter((r) => r.status === "fulfilled");
    for (const r of success) if (r.status === "fulfilled") ids.push(r.value.id);
    expect(success).toHaveLength(1);
    expect(
      (await db.variant.findUniqueOrThrow({ where: { id: variantId } })).stock,
    ).toBe(0);
    await db.variant.update({ where: { id: variantId }, data: { stock: 20 } });
  });
  it("restores reserved stock once on failed payments", async () => {
    const o = await order();
    const before = await db.variant.findUniqueOrThrow({
      where: { id: variantId },
    });
    await releaseOrder(o.id);
    await releaseOrder(o.id);
    expect(
      (await db.variant.findUniqueOrThrow({ where: { id: variantId } })).stock,
    ).toBe(before.stock + 1);
  });
  it("rejects duplicate variants and invalid phone numbers", async () => {
    await expect(
      createOrder(
        input({
          items: [
            { variantId, quantity: 1 },
            { variantId, quantity: 1 },
          ],
        }),
      ),
    ).rejects.toThrow("Duplicate");
    expect(() => input({ phone: "invalid" })).toThrow();
  });
  it("enforces single use and usage count", async () => {
    const code = `TEST-${suffix}`;
    await db.discount.create({
      data: {
        code,
        type: "PERCENT",
        value: 10,
        singleUse: true,
        usageLimit: 1,
      },
    });
    const email = `discount-${suffix}@example.test`;
    emails.push(email);
    const o = await order({ email, discountCode: code });
    expect(o.discount).toBe(2200);
    await expect(
      createOrder(input({ email, discountCode: code })),
    ).rejects.toThrow();
    await releaseOrder(o.id);
    expect(
      (await db.discount.findUniqueOrThrow({ where: { code } })).used,
    ).toBe(0);
  });
});
describe("payments", () => {
  it("rejects tampered webhook signatures", () => {
    const payload = "example";
    const secret = "test secret";
    const signature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    expect(verifySignature(payload, signature, secret)).toBe(true);
    expect(verifySignature("tampered", signature, secret)).toBe(false);
    expect(verifySignature(payload, "", secret)).toBe(false);
  });
  it("validates amount, records payment once and prevents stock release after payment", async () => {
    const o = await order();
    await expect(
      settlePayment(o.id, `evt-${o.id}`, o.total + 1, "EGP", true, "test"),
    ).rejects.toThrow("mismatch");
    await settlePayment(o.id, `evt-${o.id}`, o.total, "EGP", true, "test");
    await settlePayment(o.id, `evt-${o.id}`, o.total, "EGP", true, "test");
    expect(await db.payment.count({ where: { orderId: o.id } })).toBe(1);
    expect(await releaseOrder(o.id)).toBe(false);
    expect(
      (await db.order.findUniqueOrThrow({ where: { id: o.id } })).paymentStatus,
    ).toBe("PAID");
  });
  it("does not confirm payments after cancellation", async () => {
    const o = await order();
    await releaseOrder(o.id);
    await expect(
      settlePayment(o.id, `late-${o.id}`, o.total, "EGP", true, "test"),
    ).rejects.toThrow("manual refund");
  });
});
