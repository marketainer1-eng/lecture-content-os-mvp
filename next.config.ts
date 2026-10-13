import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // googleapis uses Node.js internals that shouldn't be bundled
  serverExternalPackages: ['googleapis'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
