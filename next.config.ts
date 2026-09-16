import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack picks its workspace root from the nearest lockfile. A stray
  // package-lock.json in a parent directory (e.g. C:\Users\<you>\package-lock.json)
  // makes it choose that instead of this project, which pulls the whole home
  // directory into the module graph. Pin the root here.
  turbopack: {
    root: __dirname,
  },
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
