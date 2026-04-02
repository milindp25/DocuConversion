/**
 * Layout with SEO metadata for the Edit PDF tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Edit PDF",
  description: "Add text, highlights, and shapes to your PDF documents. Free, fast, and no account needed.",
  path: "/tools/edit/edit-pdf",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Edit", path: "/tools/edit" },
          { name: "Edit PDF", path: "/tools/edit/edit-pdf" },
        ])}
      />
      {children}
    </>
  );
}
