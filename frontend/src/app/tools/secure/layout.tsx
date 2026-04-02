/**
 * Layout with SEO metadata for the Secure PDF category page.
 */

import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Secure PDF",
  description: "Protect PDFs with passwords, unlock encrypted files, and redact sensitive content.",
  path: "/tools/secure",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
