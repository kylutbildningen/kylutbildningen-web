import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'kylutbildningen.com' }],
        destination: 'https://kylutbildningen.se/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.kylutbildningen.com' }],
        destination: 'https://kylutbildningen.se/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
