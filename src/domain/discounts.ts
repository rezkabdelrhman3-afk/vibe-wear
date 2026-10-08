export type DiscountRule = {
  type: string;
  value: number;
  minimum: number;
  startsAt: Date;
  endsAt: Date | null;
  usageLimit: number | null;
  used: number;
  active: boolean;
};
export function calculateDiscount(
  subtotal: number,
  rule: DiscountRule | null,
  now = new Date(),
) {
  if (!rule) return 0;
  if (
    !rule.active ||
    rule.startsAt > now ||
    (rule.endsAt && rule.endsAt < now) ||
    (rule.usageLimit !== null && rule.used >= rule.usageLimit) ||
    subtotal < rule.minimum
  )
    throw new Error("This code is not available for this bag.");
  return Math.min(
    subtotal,
    rule.type === "PERCENT"
      ? Math.floor((subtotal * rule.value) / 100)
      : rule.value,
  );
}
