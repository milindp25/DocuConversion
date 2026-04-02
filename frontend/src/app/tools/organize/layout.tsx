/**
 * Layout with SEO metadata for the Organize PDF category page.
 */

import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Organize PDF",
  description: "Merge, split, compress, and rotate PDF files. Free online PDF organization tools.",
  path: "/tools/organize",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
