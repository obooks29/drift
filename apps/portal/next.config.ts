/** @type {import('next').NextConfig} */
const nextConfig = {
  // We are emptying this so Next.js doesn't try to build the broken local packages
  transpilePackages: [], 
  experimental: {},
};

module.exports = nextConfig;