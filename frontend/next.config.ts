import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable standalone for better stability in Docker
  // output: 'standalone',
  images: {
    remotePatterns: [
      // Development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'backend',
        port: '3000',
        pathname: '/uploads/**',
      },
      // Production - allow any subdomain of nafhan.com
      {
        protocol: 'https',
        hostname: '*.nafhan.com',
        pathname: '/uploads/**',
      },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
