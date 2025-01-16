/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'blob',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
};

module.exports = nextConfig; 