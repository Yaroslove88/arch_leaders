/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output for Docker deployment
  output: 'standalone',
  // Disable ESLint during build (fix later)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during build (fix later)
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  webpack: (config, { dev, isServer }) => {
    // Исправляем проблему с кэшированием webpack на Windows
    if (dev && !isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
