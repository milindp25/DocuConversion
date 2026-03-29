/**
 * Site-wide footer for DocuConversion.
 * Contains tool links, legal links, and company info.
 */

import Link from "next/link";
import { FileText } from "lucide-react";

/** Footer link sections organized by category */
const FOOTER_SECTIONS = [
  {
    title: "Convert",
    links: [
      { label: "PDF to Word", href: "/tools/convert/pdf-to-word" },
      { label: "PDF to Excel", href: "/tools/convert/pdf-to-excel" },
      { label: "PDF to Image", href: "/tools/convert/pdf-to-image" },
      { label: "Word to PDF", href: "/tools/convert/word-to-pdf" },
      { label: "Image to PDF", href: "/tools/convert/image-to-pdf" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "Edit PDF", href: "/tools/edit/edit-pdf" },
      { label: "Merge PDF", href: "/tools/organize/merge" },
      { label: "Split PDF", href: "/tools/organize/split" },
      { label: "Compress PDF", href: "/tools/organize/compress" },
      { label: "Sign PDF", href: "/tools/sign" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Blog", href: "/blog" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
] as const;

/** Props for the Footer component */
export interface FooterProps {}

export function Footer(_props: FooterProps) {
  return (
    <footer className="border-t border-gray-800/50 bg-gradient-to-b from-gray-950 to-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-semibold text-white">
              <FileText className="h-5 w-5 text-blue-400" />
              <span>DocuConversion</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-gray-500">
              Convert, edit, sign, and organize PDFs — all in one place. Free, fast, and private.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-300">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors duration-200 hover:text-blue-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-gray-800/50 pt-8">
          <p className="text-center text-sm text-gray-600">
            &copy; {new Date().getFullYear()} DocuConversion. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
