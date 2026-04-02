/**
 * Layout with SEO metadata for the Excel to PDF tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Excel to PDF",
  description: "Convert Excel spreadsheets (.xls, .xlsx) to PDF format. Free, fast, and no account needed.",
  path: "/tools/convert/excel-to-pdf",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Convert", path: "/tools/convert" },
          { name: "Excel to PDF", path: "/tools/convert/excel-to-pdf" },
        ])}
      />
      {children}
    </>
  );
}
