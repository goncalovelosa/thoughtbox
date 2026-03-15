import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output for Docker/Cloud Run deployment
  output: 'standalone',

  // Use Node.js runtime (not Edge) — Cloud Run runs full Node containers
  // serverExternalPackages can be added here when needed

  // Disable X-Powered-By header for security
  poweredByHeader: false,

  // Images: allow local and future CDN origins
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
