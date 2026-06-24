import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/index.html"
      },
      {
        source: "/privacy",
        destination: "/privacy.html"
      },
      {
        source: "/terms",
        destination: "/terms.html"
      }
    ];
  }
};

export default nextConfig;
