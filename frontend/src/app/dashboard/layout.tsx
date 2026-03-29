/**
 * Layout wrapper for the Dashboard section.
 * Server component that provides consistent page structure
 * for all dashboard routes (files, signatures, api-keys, settings).
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your files, account settings, and subscription from one place.",
};

/** Props for the DashboardLayout component */
export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {children}
    </div>
  );
}
