/**
 * Layout with SEO metadata for the Secure PDF category page.
 */

import { generatePageMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generatePageMetadata({
  title: "Secure PDF",
  description: "Protect PDFs with passwords, unlock encrypted files, and redact sensitive content.",
  path: "/tools/secure",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Secure PDF", path: "/tools/secure" },
        ])}
      />
      {children}
    </>
  );
}
