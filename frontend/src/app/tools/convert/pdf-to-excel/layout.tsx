/**
 * Layout with SEO metadata for the PDF to Excel tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "PDF to Excel",
  description: "Extract tables from PDF documents into Excel (.xlsx) spreadsheets. Free, fast, and no account needed.",
  path: "/tools/convert/pdf-to-excel",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Convert", path: "/tools/convert" },
          { name: "PDF to Excel", path: "/tools/convert/pdf-to-excel" },
        ])}
      />
      {children}
    </>
  );
}
