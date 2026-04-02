/**
 * Layout with SEO metadata for the Word to PDF tool page.
 */

import { generateToolMetadata, generateToolJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Word to PDF",
  description: "Convert Word documents (.doc, .docx) to PDF format. Free, fast, and no account needed.",
  path: "/tools/convert/word-to-pdf",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Convert", path: "/tools/convert" },
          { name: "Word to PDF", path: "/tools/convert/word-to-pdf" },
        ])}
      />
      <JsonLd
        data={generateToolJsonLd({
          title: "Word to PDF",
          description: "Convert Word documents (.doc, .docx) to PDF format. Free, fast, and no account needed.",
          path: "/tools/convert/word-to-pdf",
        })}
      />
      {children}
    </>
  );
}
