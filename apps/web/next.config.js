/** @type {import('next').NextConfig} */
const path = require('path');
const { withPayload } = require('@payloadcms/next/withPayload');

const nextConfig = {
  reactStrictMode: true,
  // Standalone output for Docker deployment
  output: 'standalone',
  transpilePackages: ['@leadership-architect/ui'],
  env: {
    // API всегда на порту 3001, Next.js на 3000
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  // Payload requires experimental features
  experimental: {
    reactCompiler: false,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Используем filesystem cache вместо отключения кэша
      // Это значительно ускоряет повторные запуски dev-сервера
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        // Изолированная директория кэша для избежания конфликтов на Windows
        cacheDirectory: path.join(__dirname, '.next/cache/webpack'),
        // Отключаем сжатие для быстрого доступа на Windows
        compression: false,
        // Версионирование кэша
        version: '1.0.0',
      };
    }
    
    return config;
  },
  onDemandEntries: {
    // Увеличиваем время жизни страниц в памяти для быстрой навигации
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

module.exports = withPayload(nextConfig);
