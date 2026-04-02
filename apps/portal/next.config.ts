/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@drift-ai/sdk", "@drift-ai/db"],
  experimental: {},
};

module.exports = nextConfig;