import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // Images: allow local and future CDN origins
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
