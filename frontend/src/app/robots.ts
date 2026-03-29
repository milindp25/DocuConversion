/**
 * Robots.txt configuration for DocuConversion.
 * Allows crawling of all public pages while blocking API routes
 * and authenticated dashboard pages.
 */

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/"],
    },
    sitemap: "https://docuconversion.com/sitemap.xml",
  };
}
