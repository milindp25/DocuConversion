/**
 * Dashboard page for DocuConversion.
 * Shows user profile, usage stats, recent files, and account sections.
 * Requires authentication — displays a sign-in prompt for unauthenticated users.
 * Uses next-auth/react useSession for client-side auth state.
 */

"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { getHistory, clearHistory, type FileHistoryEntry } from "@/lib/file-history";
import {
  getSignatures,
  deleteSignature,
  MAX_SIGNATURES_FREE,
  type SavedSignature,
} from "@/lib/signatures";
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
  Trash2,
  Plus,
  Rocket,
  Users,
  MessageSquare,
  UserCheck,
  CloudCog,
  Webhook,
  Palette,
} from "lucide-react";

/** Supported sidebar navigation tabs */
export type DashboardTab = "files" | "signatures" | "api-keys" | "settings" | "upcoming";

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
  { id: "upcoming", label: "Upcoming Features", icon: Rocket },
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
 * Format a relative date string from an ISO date.
 */
function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Recent files section — reads completed jobs from localStorage.
 * Displays a table of file history entries with download links.
 */
function RecentFilesSection() {
  const [history, setHistory] = useState<FileHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Recent Files</h2>
        {history.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 transition-colors duration-200 hover:bg-gray-800 hover:text-gray-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear history
          </button>
        )}
      </div>

      {/* Session notice */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
        <p className="text-sm text-blue-300/80">
          File history is stored locally in your browser. Persistent server-side history coming soon.
        </p>
      </div>

      {history.length === 0 ? (
        /* Empty state */
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
      ) : (
        /* File table */
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
              {history.map((entry) => (
                <tr
                  key={entry.id}
                  className="transition-colors duration-150 hover:bg-gray-800/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 flex-shrink-0 text-blue-400" />
                      <span className="truncate text-sm text-gray-200">
                        {entry.filename}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {entry.operation}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatRelativeDate(entry.date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400 ring-1 ring-green-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={entry.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors duration-200 hover:bg-blue-500/10"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * Saved signatures section — displays signature preview cards from localStorage.
 * Users can delete existing signatures or navigate to the sign tool to add new ones.
 */
function SavedSignaturesSection() {
  const [signatures, setSignatures] = useState<SavedSignature[]>([]);

  useEffect(() => {
    setSignatures(getSignatures());
  }, []);

  const handleDelete = (id: string) => {
    deleteSignature(id);
    setSignatures(getSignatures());
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Saved Signatures</h2>
        <span className="text-sm text-gray-400">
          {signatures.length} of {MAX_SIGNATURES_FREE} signatures saved
        </span>
      </div>

      {signatures.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-700 bg-gray-900/30 px-8 py-20 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800/50 ring-1 ring-gray-700">
            <PenTool className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white">No saved signatures</h3>
          <p className="mt-2 max-w-sm text-sm text-gray-400">
            Create and save your electronic signature to reuse across documents.
          </p>
          <Link
            href="/tools/sign/sign-pdf"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" />
            Create a signature
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div>
          {/* Signature cards grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {signatures.map((sig) => (
              <div
                key={sig.id}
                className="group relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/60 p-4 backdrop-blur-sm transition-colors duration-200 hover:border-gray-700"
              >
                {/* Signature preview */}
                <div className="flex h-24 items-center justify-center rounded-lg bg-white/5 p-2">
                  <Image
                    src={sig.imageDataUrl}
                    alt={sig.name}
                    width={192}
                    height={80}
                    className="max-h-20 w-auto object-contain"
                    unoptimized
                  />
                </div>

                {/* Signature info */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {sig.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(sig.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(sig.id)}
                    className="rounded-lg p-1.5 text-gray-500 opacity-0 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                    aria-label={`Delete signature: ${sig.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add new card — only show if under limit */}
            {signatures.length < MAX_SIGNATURES_FREE && (
              <Link
                href="/tools/sign/sign-pdf"
                className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-900/30 p-4 text-center transition-colors duration-200 hover:border-gray-600 hover:bg-gray-900/50"
              >
                <div className="flex h-24 items-center justify-center">
                  <Plus className="h-8 w-8 text-gray-600" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-400">
                  Add new signature
                </p>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Planned features for the Upcoming Features tab */
const UPCOMING_FEATURES = [
  {
    icon: Users,
    iconColor: "text-green-400",
    bgColor: "bg-green-500/10 ring-green-500/20",
    title: "Real-time Collaboration",
    description: "Edit and review PDFs together with your team in real time. See live cursors and annotations.",
  },
  {
    icon: MessageSquare,
    iconColor: "text-yellow-400",
    bgColor: "bg-yellow-500/10 ring-yellow-500/20",
    title: "Comment Threads",
    description: "Add threaded comments to specific areas of your documents for structured feedback and review.",
  },
  {
    icon: UserCheck,
    iconColor: "text-pink-400",
    bgColor: "bg-pink-500/10 ring-pink-500/20",
    title: "Multi-signer Workflows",
    description: "Route documents to multiple signers with defined signing order and deadline tracking.",
  },
  {
    icon: CloudCog,
    iconColor: "text-sky-400",
    bgColor: "bg-sky-500/10 ring-sky-500/20",
    title: "Google Drive / Dropbox Integration",
    description: "Import and export files directly from your cloud storage. Automatic sync and backup.",
  },
  {
    icon: Webhook,
    iconColor: "text-orange-400",
    bgColor: "bg-orange-500/10 ring-orange-500/20",
    title: "Webhooks & Zapier",
    description: "Automate workflows with webhook notifications and Zapier integration for 5,000+ apps.",
  },
  {
    icon: Palette,
    iconColor: "text-violet-400",
    bgColor: "bg-violet-500/10 ring-violet-500/20",
    title: "Custom Branding",
    description: "Add your company logo, colors, and branding to generated PDFs and share pages.",
  },
];

/**
 * Upcoming Features section — shows a grid of planned features with badges.
 */
function UpcomingFeaturesSection() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Upcoming Features</h2>
        <p className="mt-2 text-sm text-gray-400">
          These features are on our roadmap. Stay tuned for updates.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {UPCOMING_FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-6 backdrop-blur-sm transition-colors duration-200 hover:border-gray-700"
          >
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${feature.bgColor}`}
            >
              <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
            </div>
            <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
            <p className="mt-2 flex-1 text-xs leading-relaxed text-gray-400">
              {feature.description}
            </p>
            <span className="mt-4 inline-flex w-fit items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-blue-500/20">
              <Sparkles className="h-3 w-3" />
              Coming Soon
            </span>
          </div>
        ))}
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
      return <SavedSignaturesSection />;
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
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-800 bg-gray-900/40 px-8 py-16 text-center backdrop-blur-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800/50 ring-1 ring-gray-700">
            <Settings className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Account Settings</h2>
          <p className="mt-2 max-w-sm text-sm text-gray-400">
            Manage your profile, preferences, connected accounts, and more.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-500"
          >
            <Settings className="h-4 w-4" />
            Open Settings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      );
    case "upcoming":
      return <UpcomingFeaturesSection />;
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
