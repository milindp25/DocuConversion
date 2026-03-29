/**
 * Layout with SEO metadata for the Add Watermark tool page.
 */

import { generateToolMetadata } from "@/lib/seo";

export const metadata = generateToolMetadata({
  title: "Add Watermark",
  description: "Add a customizable text watermark to your PDF documents. Free, fast, and no account needed.",
  path: "/tools/edit/add-watermark",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
