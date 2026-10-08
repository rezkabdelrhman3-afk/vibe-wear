import type { MetadataRoute } from "next";
import { appUrl, isDemo } from "@/lib/utils";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: isDemo()
      ? { userAgent: "*", disallow: "/" }
      : {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/admin",
            "/api",
            "/checkout",
            "/orders",
            "/payment",
            "/search",
          ],
        },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
