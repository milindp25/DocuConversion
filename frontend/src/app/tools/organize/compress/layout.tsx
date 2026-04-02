/**
 * Layout with SEO metadata for the Compress PDF tool page.
 */

import { generateToolMetadata, generateToolJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Compress PDF",
  description: "Reduce PDF file size while maintaining quality. Free, fast, and no account needed.",
  path: "/tools/organize/compress",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Organize", path: "/tools/organize" },
          { name: "Compress PDF", path: "/tools/organize/compress" },
        ])}
      />
      <JsonLd
        data={generateToolJsonLd({
          title: "Compress PDF",
          description: "Reduce PDF file size while maintaining quality. Free, fast, and no account needed.",
          path: "/tools/organize/compress",
        })}
      />
      {children}
    </>
  );
}
