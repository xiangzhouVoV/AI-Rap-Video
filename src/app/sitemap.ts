import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/i-found-you-in-the-crowd",
    "/dance-rap-video",
    "/rap-video",
    "/music-video-generator",
    "/rap-name-generator",
    "/effects/",
    "/privacy",
    "/terms",
    "/refunds",
    "/cookies",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "weekly",
    priority:
      path === "" ? 1 : path === "/i-found-you-in-the-crowd" ? 0.9 : 0.6,
  }));
}
