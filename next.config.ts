import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Allow the dev server's client runtime/HMR to work when opened from another
  // device on the LAN (e.g. testing on a phone), not just localhost.
  allowedDevOrigins: ['192.168.0.84'],
}

export default nextConfig
