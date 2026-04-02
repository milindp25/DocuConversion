/**
 * Layout with SEO metadata for the Chat with PDF tool page.
 */

import { generateToolMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = generateToolMetadata({
  title: "Chat with PDF",
  description: "Ask questions about your PDF and get instant AI-powered answers. Free, fast, and no account needed.",
  path: "/tools/ai/chat",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "AI", path: "/tools/ai" },
          { name: "Chat with PDF", path: "/tools/ai/chat" },
        ])}
      />
      {children}
    </>
  );
}
