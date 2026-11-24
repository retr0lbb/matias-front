import type { NextConfig } from "next";
import { BACKEND_URL } from "./lib/backend-url";

const nextConfig: NextConfig = {
  // Proxy /api/* to the backend so its session cookie is first-party.
  // This proxy buffers whole responses, so the chat stream has its own
  // route handler (app/api/ai/chat/stream/route.ts), which takes precedence.
  rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/:path*` }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    agentUpgrade: "security",
  },
  images: {
    // Object form (not `new URL`) so Unsplash query params like ?w=1600 are allowed.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
