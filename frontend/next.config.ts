import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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
            value: [
              `default-src 'self'`,
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://us-assets.i.posthog.com`,
              `style-src 'self' 'unsafe-inline'`,
              `img-src 'self' data: https://*.r2.cloudflarestorage.com`,
              `font-src 'self' data:`,
              `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"} https://us.i.posthog.com https://*.sentry.io`,
              `frame-ancestors 'none'`,
            ].join("; "),
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
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
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

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Only print Sentry output when running in CI to keep local builds clean
  silent: !process.env.CI,
  // Upload a larger set of source maps for better stack traces
  widenClientFileUpload: true,
  // Delete uploaded source maps after they are sent to Sentry
  sourcemaps: {
    filesToDeleteAfterUpload: [".next/static/**/*.map"],
  },
  // Swallow source map upload errors so builds don't fail when the
  // Sentry project/org aren't configured yet in the deployment env.
  errorHandler: (err) => {
    console.warn("[sentry] Source map upload failed (non-fatal):", err.message);
  },
});
