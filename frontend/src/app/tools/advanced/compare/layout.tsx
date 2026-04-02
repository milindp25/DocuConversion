/**
 * Layout with SEO metadata for the Compare PDFs tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Compare PDFs",
  description: "Compare two PDF documents and see the differences highlighted. Free, fast, and no account needed.",
  path: "/tools/advanced/compare",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Advanced", path: "/tools/advanced" },
          { name: "Compare PDFs", path: "/tools/advanced/compare" },
        ])}
      />
      {children}
    </>
  );
}
