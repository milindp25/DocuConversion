/**
 * Layout with SEO metadata for the Protect PDF tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Protect PDF",
  description: "Add password protection to your PDF document. Free, fast, and no account needed.",
  path: "/tools/secure/protect",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Secure", path: "/tools/secure" },
          { name: "Protect PDF", path: "/tools/secure/protect" },
        ])}
      />
      {children}
    </>
  );
}
