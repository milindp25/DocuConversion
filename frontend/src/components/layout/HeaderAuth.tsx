/**
 * Auth-aware header controls.
 * Shows login/signup when anonymous, user dropdown when authenticated.
 * Extracted as a client component because it uses useSession().
 */

"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, User, Settings } from "lucide-react";

/** Props for the HeaderAuth component */
export interface HeaderAuthProps {}

export function HeaderAuth(_props: HeaderAuthProps) {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Loading state — show skeleton placeholder
  if (status === "loading") {
    return (
      <div className="flex items-center gap-3">
        <div className="h-5 w-12 animate-pulse rounded bg-gray-700" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-700" />
      </div>
    );
  }

  // Unauthenticated — show login/signup links
  if (status === "unauthenticated") {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-medium text-gray-600 transition-colors duration-200 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="animate-glow-pulse rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700"
        >
          Sign up free
        </Link>
      </div>
    );
  }

  // Authenticated — show user avatar with dropdown
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();
  const tier = (session as any)?.tier || "free";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setDropdownOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
          {userInitial}
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {dropdownOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900"
          role="menu"
        >
          {/* User info */}
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {userName}
            </p>
            <p className="truncate text-xs text-gray-500">{userEmail}</p>
            <span
              className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                tier === "premium"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              }`}
            >
              {tier === "premium" ? "Premium" : "Free"}
            </span>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/account"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
            >
              <User className="h-4 w-4" />
              Account
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>

          {/* Sign out */}
          <div className="border-t border-gray-100 py-1 dark:border-gray-800">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors duration-200 hover:bg-gray-50 dark:text-red-400 dark:hover:bg-gray-800"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
