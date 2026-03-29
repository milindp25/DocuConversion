/**
 * Mobile hamburger menu for DocuConversion.
 * Renders a slide-in overlay with navigation links and auth controls.
 * Visible on small screens (below md breakpoint), hidden on desktop.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, LogOut, User } from "lucide-react";

/** Navigation links displayed in the mobile menu */
const NAV_LINKS = [
  { label: "Convert", href: "/tools/convert" },
  { label: "Edit", href: "/tools/edit" },
  { label: "Organize", href: "/tools/organize" },
  { label: "Sign", href: "/tools/sign" },
  { label: "Secure", href: "/tools/secure" },
  { label: "AI Tools", href: "/tools/ai" },
  { label: "Pricing", href: "/pricing" },
] as const;

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  /** Close menu on route change */
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  /** Lock body scroll when menu is open */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /** Close on click outside (on the overlay backdrop) */
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === overlayRef.current) {
        setIsOpen(false);
      }
    },
    []
  );

  /** Close on Escape key */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        aria-controls="mobile-menu-panel"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay + slide-in panel */}
      {isOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            id="mobile-menu-panel"
            className="absolute right-0 top-0 flex h-full w-72 animate-slide-in-right flex-col bg-gray-950 shadow-2xl"
          >
            {/* Close button */}
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-4">
              <span className="text-sm font-semibold text-gray-400">Menu</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-800 hover:text-white"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <ul className="space-y-1" role="list">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                        pathname.startsWith(link.href)
                          ? "bg-blue-600/10 text-blue-400"
                          : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Auth section */}
            <div className="border-t border-gray-800 px-4 py-4">
              {status === "loading" && (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-gray-800" />
                  <div className="h-4 w-24 animate-pulse rounded bg-gray-800" />
                </div>
              )}

              {status === "unauthenticated" && (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="rounded-lg border border-gray-700 px-4 py-2.5 text-center text-sm font-medium text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-800/50 hover:text-white"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-500"
                  >
                    Sign up free
                  </Link>
                </div>
              )}

              {status === "authenticated" && session?.user && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                      {(session.user.name || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {session.user.name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/account"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-800/50 hover:text-white"
                    >
                      <User className="h-4 w-4" aria-hidden="true" />
                      Account
                    </Link>
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-gray-800/50 hover:text-red-300"
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
