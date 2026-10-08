export function money(amount: number) {
  return (
    new Intl.NumberFormat("en-EG", {
      maximumFractionDigits: amount % 100 ? 2 : 0,
    }).format(amount / 100) + " EGP"
  );
}
export function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export const appUrl = () =>
  process.env.APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");
export const isDemo = () => process.env.COMMERCE_MODE !== "live";
export function safeMedia(url: string) {
  return url.startsWith("/media/") ||
    url.startsWith("/uploads/") ||
    /^https:\/\/[^\s]+$/.test(url)
    ? url
    : "/media/cream.jpg";
}
