/**
 * Layout with SEO metadata for the Advanced PDF Tools category page.
 */

import { generatePageMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generatePageMetadata({
  title: "Advanced PDF Tools",
  description: "Advanced PDF operations — compare documents side-by-side, flatten forms, and batch process.",
  path: "/tools/advanced",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Advanced PDF Tools", path: "/tools/advanced" },
        ])}
      />
      {children}
    </>
  );
}
