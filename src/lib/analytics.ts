"use client";
type EventName =
  | "view_product"
  | "select_variant"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "purchase"
  | "search"
  | "view_collection";
type AnalyticsAdapter = (
  name: EventName,
  data: Record<string, unknown>,
) => void;
const adapters: AnalyticsAdapter[] = [];
export function registerAnalytics(adapter: AnalyticsAdapter) {
  adapters.push(adapter);
  return () => {
    const i = adapters.indexOf(adapter);
    if (i >= 0) adapters.splice(i, 1);
  };
}
export function track(name: EventName, data: Record<string, unknown> = {}) {
  if (
    typeof window === "undefined" ||
    localStorage.getItem("mashy-analytics-consent") !== "yes"
  )
    return;
  for (const adapter of adapters) adapter(name, data);
  window.dispatchEvent(
    new CustomEvent("mashy:analytics", { detail: { name, data } }),
  );
}
