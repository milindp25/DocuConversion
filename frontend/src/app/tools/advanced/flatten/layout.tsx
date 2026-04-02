/**
 * Layout with SEO metadata for the Flatten PDF tool page.
 */

import { generateToolMetadata, generateToolJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Flatten PDF",
  description: "Flatten form fields and annotations into the PDF document. Free, fast, and no account needed.",
  path: "/tools/advanced/flatten",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Advanced", path: "/tools/advanced" },
          { name: "Flatten PDF", path: "/tools/advanced/flatten" },
        ])}
      />
      <JsonLd
        data={generateToolJsonLd({
          title: "Flatten PDF",
          description: "Flatten form fields and annotations into the PDF document. Free, fast, and no account needed.",
          path: "/tools/advanced/flatten",
        })}
      />
      {children}
    </>
  );
}
