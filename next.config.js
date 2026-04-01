/** @type {import('next').NextConfig} */
const withBundleAnalyzer = process.env.ANALYZE === 'true' 
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config;

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'logistika.api.ardentsoft.uz',
            },
            {
                protocol: 'https',
                hostname: 'xojiaka.uz',
            }
        ],
    },
    turbopack: {}, // Mutes Turbopack vs Webpack warning in Next 16+
    typescript: {
        ignoreBuildErrors: true,
    },
    // Performance optimizatsiyasi
    experimental: {
        optimizeCss: true,
        optimizePackageImports: ['antd', 'lodash', '@ant-design/charts', 'recharts', 'framer-motion'],
    },
    // Qo'shimcha konfiguratsiyalar
    productionBrowserSourceMaps: false, // Source map yaratmaslik (tezroq build uchun)
    poweredByHeader: false, // X-Powered-By headerini olib tashlash
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production', // Production-da console.log-larni olib tashlash
    },
    // Improve performance
    reactStrictMode: false,
    webpack: (config, { dev }) => {
        if (dev) {
            config.devtool = 'source-map'; // Eval ishlatmaslik uchun
        }
        return config;
    },
};

module.exports = withBundleAnalyzer(nextConfig);
