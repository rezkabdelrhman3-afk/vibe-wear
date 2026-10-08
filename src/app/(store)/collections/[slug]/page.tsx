import { CatalogView } from "@/components/catalog-view";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
export default async function Collection({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const c = await db.collection.findUnique({ where: { slug } });
  if (!c) notFound();
  return (
    <CatalogView
      params={await searchParams}
      collection={slug}
      title={c.name.toUpperCase().replace(" / ", " /\n")}
    />
  );
}
