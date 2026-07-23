/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["isomorphic-dompurify"],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;
