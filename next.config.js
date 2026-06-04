/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-select'],
  },
  images: {
    unoptimized: true,
    formats: ['image/webp'],
    minimumCacheTTL: 86400,
  },
}

module.exports = nextConfig
