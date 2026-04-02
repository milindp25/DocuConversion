/**
 * Layout with SEO metadata for the Unlock PDF tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Unlock PDF",
  description: "Remove password protection from a PDF document. Free, fast, and no account needed.",
  path: "/tools/secure/unlock",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Secure", path: "/tools/secure" },
          { name: "Unlock PDF", path: "/tools/secure/unlock" },
        ])}
      />
      {children}
    </>
  );
}
