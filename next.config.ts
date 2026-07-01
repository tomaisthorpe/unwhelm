import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {}, // Enable Turbopack (default in Next.js 16+)
  outputFileTracingIncludes: {
    // Include Prisma CLI and its dependencies in standalone output
    "/": [
      "./node_modules/prisma/**/*",
      "./node_modules/@prisma/**/*",
      "./node_modules/.bin/prisma",
      "./node_modules/jiti/**/*",
    ],
  },
  poweredByHeader: false,
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withSerwist(bundleAnalyzer(nextConfig));
