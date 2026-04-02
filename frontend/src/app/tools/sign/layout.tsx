/**
 * Layout with SEO metadata for the Sign PDF category page.
 */

import { generatePageMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generatePageMetadata({
  title: "Sign PDF",
  description: "Add electronic signatures to PDF documents. Free, legally valid, no account needed.",
  path: "/tools/sign",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Sign PDF", path: "/tools/sign" },
        ])}
      />
      {children}
    </>
  );
}
