import { db } from "@/lib/db";
import { settings, products } from "@/lib/catalog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductDetail } from "@/components/product-detail";
import { ProductCard } from "@/components/product-card";
import { appUrl, isDemo } from "@/lib/utils";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await db.product.findUnique({ where: { slug } });
  return {
    title: p?.seoTitle || p?.name || "Product",
    description: p?.seoDescription || p?.description,
    alternates: { canonical: `/products/${slug}` },
  };
}
export default async function Product({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [p, site, all] = await Promise.all([
    db.product.findUnique({
      where: { slug },
      include: { variants: true, collection: true },
    }),
    settings(),
    products(),
  ]);
  if (!p || p.status !== "ACTIVE") notFound();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images.map((i) => `${appUrl()}${i}`),
    brand: { "@type": "Brand", name: "MASHY" },
    ...(!isDemo()
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "EGP",
            price: p.price / 100,
            availability: p.variants.some((v) => v.stock > 0)
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: `${appUrl()}/products/${p.slug}`,
          },
        }
      : {}),
  };
  return (
    <main id="main">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/shop">Chapter 01</Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <ProductDetail product={p} lowStock={site.lowStockThreshold} />
      <section className="section-pad">
        <div className="section-heading">
          <h2>IN GOOD COMPANY.</h2>
          <Link className="underlined" href="/shop">
            Explore the collection ↗︎
          </Link>
        </div>
        <div className="product-grid">
          {all
            .filter((v) => v.id !== p.id)
            .slice(0, 3)
            .map((v, i) => (
              <ProductCard key={v.id} product={v} index={i} />
            ))}
        </div>
      </section>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            schema,
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: appUrl(),
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Shop",
                  item: `${appUrl()}/shop`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: p.name,
                  item: `${appUrl()}/products/${p.slug}`,
                },
              ],
            },
          ]).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
