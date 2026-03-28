import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@drift-ai/sdk", "@drift-ai/db"],
};

export default nextConfig;
