/**
 * Layout with SEO metadata for the Convert PDF category page.
 */

import { generatePageMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generatePageMetadata({
  title: "Convert PDF",
  description: "Convert PDFs to Word, Excel, PowerPoint, images, and more. Free online PDF conversion tools.",
  path: "/tools/convert",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Convert PDF", path: "/tools/convert" },
        ])}
      />
      {children}
    </>
  );
}
