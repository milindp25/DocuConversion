/**
 * SEO metadata utilities for DocuConversion.
 * Provides a reusable helper to generate consistent OpenGraph and
 * Twitter Card metadata for all tool pages.
 */

import type { Metadata } from "next";

/** Input shape for generating tool page metadata */
export interface ToolMetadataInput {
  /** Display title of the tool (e.g., "PDF to Word") */
  title: string;
  /** Short description of what the tool does */
  description: string;
  /** URL path of the tool page (e.g., "/tools/convert/pdf-to-word") */
  path: string;
}

/**
 * Generates Next.js Metadata for a tool page, including OpenGraph
 * and Twitter Card tags for optimal social sharing.
 *
 * @param tool - Tool page metadata input
 * @returns Next.js Metadata object
 */
export function generateToolMetadata(tool: ToolMetadataInput): Metadata {
  return {
    title: `${tool.title} — Free Online Tool | DocuConversion`,
    description: tool.description,
    openGraph: {
      title: `${tool.title} | DocuConversion`,
      description: tool.description,
      url: `https://docuconversion.com${tool.path}`,
      siteName: "DocuConversion",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: tool.title,
      description: tool.description,
    },
  };
}

/**
 * Generates JSON-LD structured data for a tool page.
 * Returns a Schema.org SoftwareApplication object that search engines
 * use for rich result snippets.
 *
 * @param tool - Tool page metadata input
 * @returns JSON-LD object suitable for the JsonLd component
 */
export function generateToolJsonLd(
  tool: ToolMetadataInput
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.title} — DocuConversion`,
    description: tool.description,
    url: `https://docuconversion.com${tool.path}`,
    applicationCategory: "Productivity",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}
