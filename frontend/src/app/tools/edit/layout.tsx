/**
 * Layout with SEO metadata for the Edit PDF category page.
 */

import { generatePageMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generatePageMetadata({
  title: "Edit PDF",
  description: "Edit PDFs online — add text, images, watermarks, and page numbers. Free and easy to use.",
  path: "/tools/edit",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Edit PDF", path: "/tools/edit" },
        ])}
      />
      {children}
    </>
  );
}
