import { db } from "@/lib/db";
import { settings } from "@/lib/catalog";
import { CartProvider } from "@/components/cart-provider";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { isDemo } from "@/lib/utils";
export const dynamic = "force-dynamic";
export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [site, footer] = await Promise.all([
    settings(),
    db.content.findUnique({ where: { key: "footer" } }),
  ]);
  return (
    <CartProvider threshold={site.freeShippingThreshold}>
      <div className="announcement">
        <span>{site.announcement}</span>
        <span>
          {isDemo()
            ? "CHAPTER 01 / CONCEPT STORE"
            : "CHAPTER 01 / NOW EXPLORING"}
        </span>
      </div>
      <Navigation />
      {children}
      <Footer
        title={footer?.title || "WHATEVER TODAY LOOKS LIKE."}
        body={footer?.body || "KEEP MASHY."}
      />
    </CartProvider>
  );
}
