/**
 * Layout with SEO metadata for the HTML to PDF tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "HTML to PDF",
  description: "Convert web pages and HTML files to PDF format. Free, fast, and no account needed.",
  path: "/tools/convert/html-to-pdf",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Convert", path: "/tools/convert" },
          { name: "HTML to PDF", path: "/tools/convert/html-to-pdf" },
        ])}
      />
      {children}
    </>
  );
}
