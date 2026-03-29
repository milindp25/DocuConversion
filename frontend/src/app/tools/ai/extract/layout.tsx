/**
 * Layout with SEO metadata for the Smart Extraction tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Smart Extraction",
  description: "Extract tables, key-value pairs, and named entities from your PDF using AI. Free, fast, and no account needed.",
  path: "/tools/ai/extract",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
