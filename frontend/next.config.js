/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Skip static generation for pages that require runtime environment variables
  skipTrailingSlashRedirect: true,
  // App Router is now stable in Next.js 14, no experimental config needed
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  // Handle environment variables during build
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Disable static optimization for pages that need runtime environment variables
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig 