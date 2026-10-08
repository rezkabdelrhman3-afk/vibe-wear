"use client";
import { useEffect } from "react";
import { track } from "@/lib/analytics";
export function CatalogEvent({
  query,
  collection,
}: {
  query?: string;
  collection?: string;
}) {
  useEffect(() => {
    if (query) track("search", { query });
    else track("view_collection", { collection: collection || "all" });
  }, [query, collection]);
  return null;
}
