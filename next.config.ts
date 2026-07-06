import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    // TypeScript is checked separately with `npx tsc --noEmit`.
    // This avoids a Next.js 16 Turbopack build hang after successful compilation.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "www.powerschool.com" },
    ],
  },
};

export default nextConfig;
