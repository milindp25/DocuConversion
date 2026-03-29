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
import { ToastProvider } from "@/components/providers/ToastProvider";
import { GlobalDropZone } from "@/components/tools/GlobalDropZone";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Convert, Edit & Sign PDFs Online`,
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <AuthProvider>
          <ToastProvider>
            <GlobalDropZone />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
