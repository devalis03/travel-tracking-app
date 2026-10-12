/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/timeline', destination: '/trips/timeline', permanent: false },
      { source: '/list', destination: '/trips/list', permanent: false },
      { source: '/trips', destination: '/trips/list', permanent: false },
    ]
  },
}

export default nextConfig
