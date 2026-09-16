import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack picks its workspace root from the nearest lockfile. A stray
  // package-lock.json in a parent directory (e.g. C:\Users\<you>\package-lock.json)
  // makes it choose that instead of this project, which pulls the whole home
  // directory into the module graph. Pin the root here.
  turbopack: {
    root: __dirname,
  },
  // Next 16 blocks dev-server resources (HMR, dev chunks) for origins other
  // than the one the server was started on, which floods the terminal with
  // "Blocked cross-origin request to Next.js dev resource" and stops the page
  // from hydrating. `npm run dev` prints a Network URL - allow the LAN hosts
  // used to open that URL.
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.0.192",
    "192.168.0.*",
  ],
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
