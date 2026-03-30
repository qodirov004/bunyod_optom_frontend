/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'xojiaka.uz',
        port: '',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'xojiaka.uz',
        port: '',
        pathname: '/media/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false, // 🔧 ESLint xatolarini ko‘rsatadi
  },
  typescript: {
    ignoreBuildErrors: false, // 🔧 TypeScript xatolarini buildda chiqaradi
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'source-map'; // Eval ishlatmaslik uchun
    }
    return config;
  },
};

module.exports = nextConfig;
