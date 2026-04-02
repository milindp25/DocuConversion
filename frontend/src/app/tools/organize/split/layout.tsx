/**
 * Layout with SEO metadata for the Split PDF tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Split PDF",
  description: "Split a PDF into separate documents by page range. Free, fast, and no account needed.",
  path: "/tools/organize/split",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Organize", path: "/tools/organize" },
          { name: "Split PDF", path: "/tools/organize/split" },
        ])}
      />
      {children}
    </>
  );
}
