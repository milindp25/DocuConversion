/**
 * Layout with SEO metadata for the Add Page Numbers tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Add Page Numbers",
  description: "Add customizable page numbers to your PDF documents. Free, fast, and no account needed.",
  path: "/tools/edit/add-page-numbers",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
