/**
 * Layout with SEO metadata for the PowerPoint to PDF tool page.
 */

import { generateToolMetadata, generateToolJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "PowerPoint to PDF",
  description: "Convert PowerPoint presentations (.ppt, .pptx) to PDF format. Free, fast, and no account needed.",
  path: "/tools/convert/pptx-to-pdf",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Convert", path: "/tools/convert" },
          { name: "PowerPoint to PDF", path: "/tools/convert/pptx-to-pdf" },
        ])}
      />
      <JsonLd
        data={generateToolJsonLd({
          title: "PowerPoint to PDF",
          description: "Convert PowerPoint presentations (.ppt, .pptx) to PDF format. Free, fast, and no account needed.",
          path: "/tools/convert/pptx-to-pdf",
        })}
      />
      {children}
    </>
  );
}
