import type { NextConfig } from "next";

/**
 * Next.js configuration for DocuConversion.
 * Configures image domains, API rewrites, and output settings.
 */
const nextConfig: NextConfig = {
  /** Enable React strict mode for development warnings */
  reactStrictMode: true,

  /** Image optimization configuration */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },

  /** Security headers applied to all routes */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.r2.cloudflarestorage.com; font-src 'self' data:; connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}`,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
