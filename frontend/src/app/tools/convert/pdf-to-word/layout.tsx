/**
 * Layout with SEO metadata for the PDF to Word tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "PDF to Word",
  description: "Convert PDF documents to editable Word (.docx) files. Free, fast, and no account needed.",
  path: "/tools/convert/pdf-to-word",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Convert", path: "/tools/convert" },
          { name: "PDF to Word", path: "/tools/convert/pdf-to-word" },
        ])}
      />
      {children}
    </>
  );
}
