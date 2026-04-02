/**
 * Layout with SEO metadata for the Merge PDF tool page.
 */

import { generateToolMetadata, generateToolJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Merge PDF",
  description: "Combine multiple PDF files into a single document. Free, fast, and no account needed.",
  path: "/tools/organize/merge",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Organize", path: "/tools/organize" },
          { name: "Merge PDF", path: "/tools/organize/merge" },
        ])}
      />
      <JsonLd
        data={generateToolJsonLd({
          title: "Merge PDF",
          description: "Combine multiple PDF files into a single document. Free, fast, and no account needed.",
          path: "/tools/organize/merge",
        })}
      />
      {children}
    </>
  );
}
