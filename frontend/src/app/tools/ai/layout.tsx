/**
 * Layout with SEO metadata for the AI PDF Tools category page.
 */

import { generatePageMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generatePageMetadata({
  title: "AI PDF Tools",
  description: "AI-powered PDF tools — summarize, chat, extract data, and OCR. Intelligent document processing.",
  path: "/tools/ai",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "AI PDF Tools", path: "/tools/ai" },
        ])}
      />
      {children}
    </>
  );
}
