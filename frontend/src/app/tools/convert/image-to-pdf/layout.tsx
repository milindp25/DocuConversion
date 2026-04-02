/**
 * Layout with SEO metadata for the Image to PDF tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Image to PDF",
  description: "Convert image files (PNG, JPG, GIF, BMP, WebP) to PDF documents. Free, fast, and no account needed.",
  path: "/tools/convert/image-to-pdf",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Convert", path: "/tools/convert" },
          { name: "Image to PDF", path: "/tools/convert/image-to-pdf" },
        ])}
      />
      {children}
    </>
  );
}
