/**
 * Layout with SEO metadata for the Add Watermark tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Add Watermark",
  description: "Add a customizable text watermark to your PDF documents. Free, fast, and no account needed.",
  path: "/tools/edit/add-watermark",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Edit", path: "/tools/edit" },
          { name: "Add Watermark", path: "/tools/edit/add-watermark" },
        ])}
      />
      {children}
    </>
  );
}
