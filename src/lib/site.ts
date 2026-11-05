export const siteUrl = process.env.NODE_ENV === "production"
  ? "https://airaptovideo.app"
  : (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const siteName = "airaptovideo";
export const supportEmail = "support@airaptovideo.com";
export const indexable = process.env.NEXT_PUBLIC_ALLOW_INDEXING !== undefined
  ? process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true"
  : process.env.INDEXABLE === "true";
