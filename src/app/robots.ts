import type { MetadataRoute } from "next";
import { indexable, siteUrl } from "@/lib/site";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: indexable ? "/" : undefined,
      disallow: indexable ? ["/api/"] : "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
