import { db } from "@/lib/db";
import { settings } from "@/lib/catalog";
import { CheckoutForm } from "@/components/checkout-form";
import { isDemo } from "@/lib/utils";
export const metadata = { title: "Checkout", robots: { index: false } };
export default async function Checkout() {
  const [rates, site] = await Promise.all([
    db.shippingRate.findMany({
      where: { active: true },
      orderBy: { governorate: "asc" },
    }),
    settings(),
  ]);
  return (
    <CheckoutForm
      rates={rates}
      demo={isDemo()}
      threshold={site.freeShippingThreshold}
    />
  );
}
