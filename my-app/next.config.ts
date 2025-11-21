import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    // Add both domains and remote patterns to cover all Next versions/configs
    domains: [
      'duvgptwzoodyyjbdhepa.supabase.co',
      'via.placeholder.com',
      'ik.imagekit.io',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'duvgptwzoodyyjbdhepa.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        port: '',
        pathname: '/**',
      },
    ],
    // Configurações de qualidade para melhorar nitidez das imagens
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
};

export default nextConfig;
