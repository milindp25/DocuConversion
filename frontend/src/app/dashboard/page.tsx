/**
 * Dashboard page for DocuConversion.
 * Shows user profile, usage stats, recent files, and account sections.
 * Requires authentication — displays a sign-in prompt for unauthenticated users.
 * Uses next-auth/react useSession for client-side auth state.
 */

"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import {
  FileText,
  Clock,
  PenTool,
  Key,
  Settings,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Lock,
  ArrowRight,
} from "lucide-react";

/** Supported sidebar navigation tabs */
export type DashboardTab = "files" | "signatures" | "api-keys" | "settings";

/** Shape of a file entry in the Recent Files list */
export interface RecentFile {
  id: string;
  name: string;
  operation: string;
  date: string;
  status: "completed" | "failed";
  downloadUrl?: string;
}

/** Sidebar navigation items */
const SIDEBAR_NAV: { id: DashboardTab; label: string; icon: React.ElementType }[] = [
  { id: "files", label: "Recent Files", icon: Clock },
  { id: "signatures", label: "Saved Signatures", icon: PenTool },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "settings", label: "Settings", icon: Settings },
];

/**
 * Google OAuth SVG icon, extracted to avoid duplication.
 */
function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/**
 * GitHub OAuth SVG icon.
 */
function GitHubIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Unauthenticated state — prompts the user to sign in.
 */
function UnauthenticatedView() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/80 p-8 text-center shadow-xl shadow-black/20 backdrop-blur-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
          <Lock className="h-8 w-8 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          Sign in to access your dashboard
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          Your conversion history, saved files, and account settings — all in one place.
        </p>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-gray-700"
          >
            <GitHubIcon />
            Continue with GitHub
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-400 hover:text-blue-300">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Usage progress bar displayed in the sidebar.
 */
function UsageBar({
  label,
  current,
  max,
  unit,
}: {
  label: string;
  current: number;
  max: number;
  unit: string;
}) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`text-xs font-medium ${isNearLimit ? "text-amber-400" : "text-gray-300"}`}>
          {current} of {max} {unit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isNearLimit ? "bg-amber-500" : "bg-blue-500"
          }`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={`${label}: ${current} of ${max} ${unit}`}
        />
      </div>
    </div>
  );
}

/**
 * Tier badge with color-coded styling.
 */
function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    free: "bg-gray-800 text-gray-300 ring-gray-700",
    pro: "bg-blue-900/30 text-blue-400 ring-blue-500/20",
    premium: "bg-amber-900/30 text-amber-400 ring-amber-500/20",
    enterprise: "bg-indigo-900/30 text-indigo-400 ring-indigo-500/20",
  };

  const labels: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    premium: "Premium",
    enterprise: "Enterprise",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
        styles[tier] || styles.free
      }`}
    >
      {labels[tier] || "Free"}
    </span>
  );
}

/**
 * Coming soon placeholder card for unreleased dashboard sections.
 */
function ComingSoonCard({
  title,
  description,
  icon: Icon,
  iconColor,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-800 bg-gray-900/40 px-8 py-16 text-center backdrop-blur-sm">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800/50 ring-1 ring-gray-700">
        <Icon className={`h-8 w-8 ${iconColor}`} />
      </div>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-gray-400">{description}</p>
      <span className="mt-6 inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
        <Sparkles className="h-3 w-3" />
        Coming soon
      </span>
    </div>
  );
}

/**
 * Recent files section — the default dashboard view.
 * Shows the empty state since persistent file history is not yet available.
 */
function RecentFilesSection() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Recent Files</h2>
      </div>

      {/* Session notice */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
        <p className="text-sm text-blue-300/80">
          File history is available during your current session. Persistent history coming soon.
        </p>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-gray-900/30 px-8 py-20 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800/50 ring-1 ring-gray-700">
          <FileText className="h-8 w-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-white">No files yet</h3>
        <p className="mt-2 max-w-sm text-sm text-gray-400">
          Start by converting a PDF. Your recent files will appear here.
        </p>
        <Link
          href="/tools/convert"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-500"
        >
          <Upload className="h-4 w-4" />
          Convert a file
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* File table — hidden by default, shown when files exist */}
      {/* This is the template for when session-based files are available */}
      <div className="mt-8 hidden">
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  File
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Operation
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {/* Example row — will be mapped from session data */}
              <tr className="transition-colors duration-150 hover:bg-gray-800/30">
                <td className="flex items-center gap-3 px-4 py-3">
                  <FileText className="h-4 w-4 flex-shrink-0 text-blue-400" />
                  <span className="truncate text-sm text-gray-200">example.pdf</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">PDF to Word</td>
                <td className="px-4 py-3 text-sm text-gray-400">Today</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400 ring-1 ring-green-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Completed
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors duration-200 hover:bg-blue-500/10"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the content for the currently active sidebar tab.
 */
function DashboardContent({ activeTab }: { activeTab: DashboardTab }) {
  switch (activeTab) {
    case "files":
      return <RecentFilesSection />;
    case "signatures":
      return (
        <ComingSoonCard
          title="Saved Signatures"
          description="Save your electronic signatures and reuse them across documents. Draw, type, or upload your signature."
          icon={PenTool}
          iconColor="text-orange-400"
        />
      );
    case "api-keys":
      return (
        <ComingSoonCard
          title="API Keys"
          description="Access the DocuConversion developer API to integrate PDF operations into your workflow. View documentation at /api/developer."
          icon={Key}
          iconColor="text-indigo-400"
        />
      );
    case "settings":
      return (
        <ComingSoonCard
          title="Settings"
          description="Manage your account preferences, notification settings, and subscription details."
          icon={Settings}
          iconColor="text-gray-400"
        />
      );
    default:
      return <RecentFilesSection />;
  }
}

/**
 * Dashboard page component.
 * Renders authentication-gated dashboard with sidebar navigation and content area.
 */
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<DashboardTab>("files");

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  // Unauthenticated
  if (status === "unauthenticated") {
    return <UnauthenticatedView />;
  }

  // Authenticated — extract user info
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();
  const tier = (session?.user as any)?.tier || "free";

  // Mock usage stats — will be replaced with real API data
  const operationsUsed = 2;
  const operationsLimit = tier === "free" ? 5 : tier === "pro" ? 100 : 999;
  const fileSizeLimit = tier === "free" ? 10 : tier === "pro" ? 50 : 100;

  return (
    <div className="mx-auto flex max-w-7xl gap-0 px-4 py-8 sm:px-6 lg:px-8">
      {/* Sidebar */}
      <aside className="hidden w-[280px] flex-shrink-0 lg:block">
        <div className="sticky top-24 space-y-6">
          {/* User profile card */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5 backdrop-blur-sm">
            {/* Avatar + name */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{userName}</p>
                <p className="truncate text-xs text-gray-400">{userEmail}</p>
              </div>
            </div>

            {/* Tier badge */}
            <div className="mt-4">
              <TierBadge tier={tier} />
            </div>

            {/* Usage stats */}
            <div className="mt-5 space-y-4">
              <UsageBar
                label="Operations today"
                current={operationsUsed}
                max={operationsLimit}
                unit="ops"
              />
              <UsageBar
                label="File size limit"
                current={0}
                max={fileSizeLimit}
                unit="MB"
              />
            </div>

            {/* Upgrade CTA for free users */}
            {tier === "free" && (
              <Link
                href="/pricing"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-medium text-blue-400 transition-colors duration-200 hover:border-blue-500/50 hover:bg-blue-500/20"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Upgrade plan
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="rounded-2xl border border-gray-800 bg-gray-900/60 p-2 backdrop-blur-sm">
            {SIDEBAR_NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-gray-800/80 text-white"
                    : "text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
                }`}
                aria-current={activeTab === item.id ? "page" : undefined}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile tab bar */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
        {SIDEBAR_NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === item.id
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
            }`}
            aria-current={activeTab === item.id ? "page" : undefined}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="min-w-0 flex-1 pl-0 lg:pl-8">
        <DashboardContent activeTab={activeTab} />
      </main>
    </div>
  );
}
