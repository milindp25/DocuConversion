/**
 * Robots.txt configuration for DocuConversion.
 * Allows crawling of all public pages while blocking API routes,
 * authenticated dashboard pages, and login/signup.
 * Includes explicit AI crawler directives for discoverability.
 */

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/login", "/signup"],
      },
      // Explicitly welcome AI search crawlers
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/login", "/signup"],
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/login", "/signup"],
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/login", "/signup"],
      },
    ],
    sitemap: "https://www.docuconversion.com/sitemap.xml",
  };
}
