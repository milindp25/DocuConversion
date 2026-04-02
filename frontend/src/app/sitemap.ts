/**
 * Dynamic sitemap for DocuConversion.
 * Generates an XML sitemap at /sitemap.xml listing all public pages
 * and tool pages for search engine crawlers.
 *
 * Excludes login/signup (noindexed) and uses fixed dates instead of
 * new Date() to prevent Google from ignoring lastmod entirely.
 */

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.docuconversion.com";

  // Fixed dates — update these when content actually changes
  const launchDate = "2026-03-15";
  const lastContentUpdate = "2026-04-01";

  /** Static marketing and legal pages (login/signup excluded — noindexed) */
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: lastContentUpdate },
    { url: `${baseUrl}/pricing`, lastModified: lastContentUpdate },
    { url: `${baseUrl}/blog`, lastModified: lastContentUpdate },
    { url: `${baseUrl}/changelog`, lastModified: lastContentUpdate },
    { url: `${baseUrl}/privacy`, lastModified: launchDate },
    { url: `${baseUrl}/terms`, lastModified: launchDate },
  ];

  /** Blog articles — must match keys in blog/[slug]/page.tsx ARTICLES */
  const blogPages: MetadataRoute.Sitemap = [
    "/blog/pdf-to-word-guide",
    "/blog/compress-pdf-guide",
    "/blog/esignature-guide",
    "/blog/merge-pdf-guide",
    "/blog/watermark-pdf-guide",
    "/blog/ai-pdf-tools",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: lastContentUpdate,
  }));

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
    lastModified: lastContentUpdate,
  }));

  /** Individual tool pages */
  const toolPages: MetadataRoute.Sitemap = [
    // Convert
    "/tools/convert/pdf-to-word",
    "/tools/convert/pdf-to-excel",
    "/tools/convert/pdf-to-powerpoint",
    "/tools/convert/pdf-to-image",
    "/tools/convert/pdf-to-text",
    "/tools/convert/word-to-pdf",
    "/tools/convert/image-to-pdf",
    "/tools/convert/excel-to-pdf",
    "/tools/convert/pptx-to-pdf",
    "/tools/convert/html-to-pdf",
    // Edit
    "/tools/edit/edit-pdf",
    "/tools/edit/add-watermark",
    "/tools/edit/add-page-numbers",
    // Organize
    "/tools/organize/merge",
    "/tools/organize/split",
    "/tools/organize/compress",
    "/tools/organize/rotate",
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
    "/tools/advanced/batch",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: lastContentUpdate,
  }));

  return [...staticPages, ...blogPages, ...categoryPages, ...toolPages];
}
