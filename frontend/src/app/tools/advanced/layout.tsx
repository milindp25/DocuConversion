/**
 * Layout with SEO metadata for the Advanced PDF Tools category page.
 */

import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Advanced PDF Tools",
  description: "Advanced PDF operations — compare documents side-by-side, flatten forms, and batch process.",
  path: "/tools/advanced",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
