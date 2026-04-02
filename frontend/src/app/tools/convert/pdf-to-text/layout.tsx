/**
 * Layout with SEO metadata for the PDF to Text tool page.
 */

import { generateToolMetadata, generateToolJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "PDF to Text",
  description: "Extract text content from PDF documents and export as plain text files. Free, fast, and no account needed.",
  path: "/tools/convert/pdf-to-text",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Convert", path: "/tools/convert" },
          { name: "PDF to Text", path: "/tools/convert/pdf-to-text" },
        ])}
      />
      <JsonLd
        data={generateToolJsonLd({
          title: "PDF to Text",
          description: "Extract text content from PDF documents and export as plain text files. Free, fast, and no account needed.",
          path: "/tools/convert/pdf-to-text",
        })}
      />
      {children}
    </>
  );
}
