import type { NextConfig } from "next";

// Conservative baseline: no script/style CSP (Stripe, Sanity, Google Ads and
// Vapi load third-party code), but block framing by other sites and other
// classic browser-level attacks. /studio's Presentation tool frames the site
// from the same origin, which 'self' allows.
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
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
