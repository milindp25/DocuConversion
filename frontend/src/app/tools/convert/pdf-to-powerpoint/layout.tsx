/**
 * Layout with SEO metadata for the PDF to PowerPoint tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "PDF to PowerPoint",
  description: "Convert PDF documents to PowerPoint (.pptx) presentations. Free, fast, and no account needed.",
  path: "/tools/convert/pdf-to-powerpoint",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Convert", path: "/tools/convert" },
          { name: "PDF to PowerPoint", path: "/tools/convert/pdf-to-powerpoint" },
        ])}
      />
      {children}
    </>
  );
}
