import { CatalogView } from "@/components/catalog-view";
export const metadata = { title: "Search", robots: { index: false } };
export default async function Search({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <CatalogView params={await searchParams} title="FIND YOUR\nEVERYDAY." />
  );
}
