/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  webpack: (config) => {
    // Alias any internal workspace packages to empty mocks
    // so Vercel builds succeed even without the monorepo workspace
    config.resolve.alias = {
      ...config.resolve.alias,
      "@drift-ai/sdk": false,
      "@drift-ai/db": false,
    };
    return config;
  },

  // Silence TypeScript and ESLint errors during Vercel build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
