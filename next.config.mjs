/** @type {import('next').NextConfig} */
const nextConfig = {

  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.55.102'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    serverExternalPackages: ['@prisma/client'],
  },
}

export default nextConfig
