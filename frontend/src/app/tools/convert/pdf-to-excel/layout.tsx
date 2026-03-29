/**
 * Layout with SEO metadata for the PDF to Excel tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "PDF to Excel",
  description: "Extract tables from PDF documents into Excel (.xlsx) spreadsheets. Free, fast, and no account needed.",
  path: "/tools/convert/pdf-to-excel",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
