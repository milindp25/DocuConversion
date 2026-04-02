/**
 * SEO metadata utilities for DocuConversion.
 * Provides reusable helpers to generate consistent metadata, OpenGraph,
 * Twitter Card, and canonical tags for all pages.
 */

import type { Metadata } from "next";

const SITE_URL = "https://www.docuconversion.com";
const SITE_NAME = "DocuConversion";

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
 * Generates Next.js Metadata for a tool page, including canonical,
 * OpenGraph, and Twitter Card tags for optimal SEO and social sharing.
 */
export function generateToolMetadata(tool: ToolMetadataInput): Metadata {
  const canonicalUrl = `${SITE_URL}${tool.path}`;
  return {
    title: `${tool.title} — Free Online Tool`,
    description: tool.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${tool.title} — Free Online Tool | ${SITE_NAME}`,
      description: tool.description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.title} | ${SITE_NAME}`,
      description: tool.description,
    },
  };
}

/**
 * Generates standard Next.js Metadata for any non-tool page.
 * Includes canonical, OG, and Twitter tags.
 */
export function generatePageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const canonicalUrl = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

/**
 * Generates JSON-LD structured data for a tool page.
 * Returns a Schema.org SoftwareApplication object that search engines
 * use for rich result snippets.
 */
export function generateToolJsonLd(
  tool: ToolMetadataInput
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.title} — ${SITE_NAME}`,
    description: tool.description,
    url: `${SITE_URL}${tool.path}`,
    applicationCategory: "Productivity",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
}

/**
 * Generates BreadcrumbList JSON-LD for any page.
 * @param crumbs Array of {name, path} pairs from root to current page
 */
export function generateBreadcrumbJsonLd(
  crumbs: { name: string; path: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

/**
 * Generates FAQPage JSON-LD for a page with FAQ content.
 */
export function generateFaqJsonLd(
  faqs: { question: string; answer: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generates BlogPosting JSON-LD for an individual blog article.
 * Enables article carousel and AI citation eligibility.
 */
export function generateArticleJsonLd(article: {
  title: string;
  description: string;
  slug: string;
  date: string;
  author: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    url: `${SITE_URL}/blog/${article.slug}`,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      "@type": "Organization",
      name: article.author,
      url: SITE_URL,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${article.slug}`,
    },
  };
}

/** Organization JSON-LD for the homepage */
export const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  description:
    "Free online PDF tools — convert, edit, sign, and organize PDFs. Fast, private, no account required.",
  // TODO: add logo once OG image / brand assets are created
  // logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` },
  sameAs: [],
};

/** WebSite JSON-LD for the homepage (includes SearchAction for Sitelinks Searchbox) */
export const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export { SITE_URL, SITE_NAME };
