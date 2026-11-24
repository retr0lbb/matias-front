import type { NextConfig } from "next";
import { BACKEND_URL } from "./lib/backend-url";

const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone, used by the Dockerfile.
  output: "standalone",
  // Proxy /api/* to the backend so its session cookie is first-party.
  // This proxy buffers whole responses, so the chat stream has its own
  // route handler (app/api/ai/chat/stream/route.ts), which takes precedence.
  // Support contacts for the "Central de ajuda" popup (lib/contact.ts).
  // Inlined into the client bundle at build time.
  env: {
    CONTACT_MAIL: process.env.CONTACT_MAIL ?? "",
    CONTACT_NUMBER: process.env.CONTACT_NUMBER ?? "",
  },
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
