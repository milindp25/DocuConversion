/**
 * Layout with SEO metadata for the Batch Processing tool page.
 */

import { generateToolMetadata, generateToolJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Batch Processing",
  description: "Process multiple PDFs at once — compress or flatten in bulk. Free, fast, and no account needed.",
  path: "/tools/advanced/batch",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Advanced", path: "/tools/advanced" },
          { name: "Batch Processing", path: "/tools/advanced/batch" },
        ])}
      />
      <JsonLd
        data={generateToolJsonLd({
          title: "Batch Processing",
          description: "Process multiple PDFs at once — compress or flatten in bulk. Free, fast, and no account needed.",
          path: "/tools/advanced/batch",
        })}
      />
      {children}
    </>
  );
}
