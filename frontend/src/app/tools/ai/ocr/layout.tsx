/**
 * Layout with SEO metadata for the OCR tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "OCR",
  description: "Extract text from scanned PDFs and images using optical character recognition. Free, fast, and no account needed.",
  path: "/tools/ai/ocr",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "AI", path: "/tools/ai" },
          { name: "OCR", path: "/tools/ai/ocr" },
        ])}
      />
      {children}
    </>
  );
}
