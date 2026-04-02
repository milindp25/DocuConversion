/**
 * Layout with SEO metadata for the Sign PDF tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Sign PDF",
  description: "Add your electronic signature to any PDF document. Free, fast, and no account needed.",
  path: "/tools/sign/sign-pdf",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Sign", path: "/tools/sign" },
          { name: "Sign PDF", path: "/tools/sign/sign-pdf" },
        ])}
      />
      {children}
    </>
  );
}
