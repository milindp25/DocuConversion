/**
 * Layout with SEO metadata for the Add Page Numbers tool page.
 */

import { generateToolMetadata, generateToolJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Add Page Numbers",
  description: "Add customizable page numbers to your PDF documents. Free, fast, and no account needed.",
  path: "/tools/edit/add-page-numbers",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Edit", path: "/tools/edit" },
          { name: "Add Page Numbers", path: "/tools/edit/add-page-numbers" },
        ])}
      />
      <JsonLd
        data={generateToolJsonLd({
          title: "Add Page Numbers",
          description: "Add customizable page numbers to your PDF documents. Free, fast, and no account needed.",
          path: "/tools/edit/add-page-numbers",
        })}
      />
      {children}
    </>
  );
}
