/**
 * Layout with SEO metadata for the Summarize PDF tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Summarize PDF",
  description: "Get an AI-generated summary of any PDF document. Free, fast, and no account needed.",
  path: "/tools/ai/summarize",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "AI", path: "/tools/ai" },
          { name: "Summarize PDF", path: "/tools/ai/summarize" },
        ])}
      />
      {children}
    </>
  );
}
