/**
 * Layout with SEO metadata for the Sign PDF category page.
 */

import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Sign PDF",
  description: "Add electronic signatures to PDF documents. Free, legally valid, no account needed.",
  path: "/tools/sign",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
