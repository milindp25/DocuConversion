/**
 * Main navigation header for DocuConversion.
 * Displays the logo, tool category navigation, and auth controls.
 * Appears on every page via the root layout.
 */

import Link from "next/link";
import { FileText } from "lucide-react";
import { HeaderAuth } from "@/components/layout/HeaderAuth";
import { MobileMenu } from "@/components/layout/MobileMenu";

/** Navigation links for the main tool categories */
const NAV_LINKS = [
  { label: "Convert", href: "/tools/convert" },
  { label: "Edit", href: "/tools/edit" },
  { label: "Organize", href: "/tools/organize" },
  { label: "Sign", href: "/tools/sign" },
  { label: "Secure", href: "/tools/secure" },
  { label: "AI Tools", href: "/tools/ai" },
  { label: "Pricing", href: "/pricing" },
] as const;

/** Props for the Header component */
export interface HeaderProps {}

export function Header(_props: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <FileText className="h-6 w-6 text-blue-600" />
          <span className="text-lg">DocuConversion</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white after:absolute after:bottom-[-1.5px] after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-blue-600 after:transition-all after:duration-200 hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth controls — session-aware via client component */}
        <div className="hidden md:block">
          <HeaderAuth />
        </div>

        {/* Mobile menu — visible below md breakpoint */}
        <MobileMenu />
      </div>
    </header>
  );
}
