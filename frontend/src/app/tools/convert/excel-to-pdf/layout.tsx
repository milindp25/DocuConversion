/**
 * Layout with SEO metadata for the Excel to PDF tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Excel to PDF",
  description: "Convert Excel spreadsheets (.xls, .xlsx) to PDF format. Free, fast, and no account needed.",
  path: "/tools/convert/excel-to-pdf",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
