/**
 * Layout with SEO metadata for the Smart Extraction tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Smart Extraction",
  description: "Extract tables, key-value pairs, and named entities from your PDF using AI. Free, fast, and no account needed.",
  path: "/tools/ai/extract",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "AI", path: "/tools/ai" },
          { name: "Smart Extraction", path: "/tools/ai/extract" },
        ])}
      />
      {children}
    </>
  );
}
