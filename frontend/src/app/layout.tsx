/**
 * Root layout for DocuConversion.
 * Wraps every page with the shared Header, Footer, and global providers.
 * Configures fonts, metadata, and theme support.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { GlobalDropZone } from "@/components/tools/GlobalDropZone";
import { JsonLd } from "@/components/seo/JsonLd";
import { ORGANIZATION_JSONLD, WEBSITE_JSONLD } from "@/lib/seo";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://docuconversion.com"),
  title: {
    default: `${APP_NAME} — Free Online PDF Tools: Convert, Edit & Sign`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    "PDF converter",
    "PDF editor",
    "PDF to Word",
    "merge PDF",
    "sign PDF",
    "compress PDF",
    "free PDF tools",
  ],
  alternates: {
    canonical: "https://docuconversion.com",
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — Free Online PDF Tools`,
    description: APP_DESCRIPTION,
    url: "https://docuconversion.com",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Free Online PDF Tools`,
    description: APP_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <JsonLd data={ORGANIZATION_JSONLD} />
        <JsonLd data={WEBSITE_JSONLD} />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "DocuConversion",
            url: "https://docuconversion.com",
            description:
              "Convert, edit, sign, and organize PDFs — free, fast, private.",
            applicationCategory: "Productivity",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }}
        />
      </head>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <PostHogProvider>
          <AuthProvider>
            <ToastProvider>
              <GlobalDropZone />
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </ToastProvider>
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
