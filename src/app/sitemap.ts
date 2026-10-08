import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { appUrl } from "@/lib/utils";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
  });
  return [
    ...[
      "",
      "/shop",
      "/about",
      "/24",
      "/faq",
      "/contact",
      "/shipping-returns",
      "/size-guide",
      "/privacy",
      "/terms",
    ].map((path) => ({ url: `${appUrl()}${path}` })),
    ...products.map((p) => ({
      url: `${appUrl()}/products/${p.slug}`,
      lastModified: p.updatedAt,
    })),
  ];
}
