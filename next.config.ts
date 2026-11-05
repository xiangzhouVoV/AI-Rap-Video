import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  turbopack: { root: process.cwd() },
  devIndicators: false,
  serverExternalPackages: [
    "sharp",
    "heic-convert",
    "heic-decode",
    "libheif-js",
  ],
  poweredByHeader: false,
  async redirects() {
    return [{
      source: "/effects/24k-magic/full-length",
      destination: "/effects/24k-magic",
      permanent: false,
    }];
  },
  async rewrites() {
    // Cloudflare routes these directly to the backend in production.
    const backend = process.env.AUTH_BACKEND_URL;
    if (!backend) return [];
    const origin = new URL(backend).origin;
    return [
      { source: "/api/auth/:path*", destination: `${origin}/api/auth/:path*` },
      { source: "/api/me", destination: `${origin}/api/me` },
      { source: "/api/templates/:path*", destination: `${origin}/api/templates/:path*` },
      { source: "/api/template-media/:path*", destination: `${origin}/api/template-media/:path*` },
      { source: "/api/template-generations/:path*", destination: `${origin}/api/template-generations/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default config;
