import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdf-parse", "drizzle-orm", "bun:sqlite"],
  outputFileTracingIncludes: {
    "/api/resume": [
      "./node_modules/pdf-parse/**",
      "./node_modules/pdfjs-dist/**",
      "./node_modules/@napi-rs/canvas*/**",
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
