import { CatalogView } from "@/components/catalog-view";
export const metadata = {
  title: "Shop everyday essentials",
  alternates: { canonical: "/shop" },
};
export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <CatalogView params={await searchParams} />;
}
