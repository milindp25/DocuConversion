/**
 * Layout with SEO metadata for the PDF to Image tool page.
 */

import { generateToolMetadata, generateToolJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "PDF to Image",
  description: "Convert PDF pages into high-quality PNG or JPG images. Free, fast, and no account needed.",
  path: "/tools/convert/pdf-to-image",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Convert", path: "/tools/convert" },
          { name: "PDF to Image", path: "/tools/convert/pdf-to-image" },
        ])}
      />
      <JsonLd
        data={generateToolJsonLd({
          title: "PDF to Image",
          description: "Convert PDF pages into high-quality PNG or JPG images. Free, fast, and no account needed.",
          path: "/tools/convert/pdf-to-image",
        })}
      />
      {children}
    </>
  );
}
