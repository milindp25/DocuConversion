/**
 * Layout with SEO metadata for the Organize PDF category page.
 */

import { generatePageMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generatePageMetadata({
  title: "Organize PDF",
  description: "Merge, split, compress, and rotate PDF files. Free online PDF organization tools.",
  path: "/tools/organize",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Organize PDF", path: "/tools/organize" },
        ])}
      />
      {children}
    </>
  );
}
