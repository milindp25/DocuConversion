/**
 * Dynamic sitemap for DocuConversion.
 * Generates an XML sitemap at /sitemap.xml listing all public pages
 * and tool pages for search engine crawlers.
 */

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://docuconversion.com";

  /** Static marketing and legal pages */
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.2 },
  ];

  /** Tool category index pages */
  const categoryPages: MetadataRoute.Sitemap = [
    "convert",
    "edit",
    "organize",
    "sign",
    "secure",
    "ai",
    "advanced",
  ].map((category) => ({
    url: `${baseUrl}/tools/${category}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  /** Individual tool pages */
  const toolPages: MetadataRoute.Sitemap = [
    // Convert
    "/tools/convert/pdf-to-word",
    "/tools/convert/pdf-to-excel",
    "/tools/convert/pdf-to-powerpoint",
    "/tools/convert/pdf-to-image",
    "/tools/convert/word-to-pdf",
    "/tools/convert/image-to-pdf",
    // Edit
    "/tools/edit/edit-pdf",
    "/tools/edit/add-watermark",
    "/tools/edit/add-page-numbers",
    // Organize
    "/tools/organize/merge",
    "/tools/organize/split",
    "/tools/organize/compress",
    // Sign
    "/tools/sign/sign-pdf",
    // Secure
    "/tools/secure/protect",
    "/tools/secure/unlock",
    // AI
    "/tools/ai/summarize",
    "/tools/ai/chat",
    "/tools/ai/extract",
    "/tools/ai/ocr",
    // Advanced
    "/tools/advanced/compare",
    "/tools/advanced/flatten",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...toolPages];
}
