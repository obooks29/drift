/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@drift-ai/sdk'],
  experimental: { typedRoutes: true },
  images: { remotePatterns: [{ hostname: '*.googleusercontent.com' }, { hostname: 'avatars.githubusercontent.com' }] },
}

module.exports = nextConfig
