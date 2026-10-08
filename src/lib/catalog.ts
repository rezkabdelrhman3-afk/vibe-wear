import { db } from "./db";
export async function settings() {
  return db.siteSettings.findUniqueOrThrow({ where: { id: "site" } });
}
export async function products() {
  return db.product.findMany({
    where: { status: "ACTIVE" },
    include: { variants: true, collection: true },
    orderBy: { createdAt: "asc" },
  });
}
export type CatalogProduct = Awaited<ReturnType<typeof products>>[number];
