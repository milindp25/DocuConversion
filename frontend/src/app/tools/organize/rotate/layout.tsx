/**
 * Layout with SEO metadata for the Rotate PDF tool page.
 */

import { generateToolMetadata, generateToolJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Rotate PDF",
  description: "Rotate PDF pages by 90, 180, or 270 degrees. Free, fast, and no account needed.",
  path: "/tools/organize/rotate",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Organize", path: "/tools/organize" },
          { name: "Rotate PDF", path: "/tools/organize/rotate" },
        ])}
      />
      <JsonLd
        data={generateToolJsonLd({
          title: "Rotate PDF",
          description: "Rotate PDF pages by 90, 180, or 270 degrees. Free, fast, and no account needed.",
          path: "/tools/organize/rotate",
        })}
      />
      {children}
    </>
  );
}
