/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  cleanDistDir: true,
  // Cache bust timestamp: 2024-03-17T12:00:00Z
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

export default nextConfig
