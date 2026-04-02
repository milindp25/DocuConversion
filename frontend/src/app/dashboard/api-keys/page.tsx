/**
 * API Keys management stub page.
 * Displays a "Coming Soon" placeholder for the API key management
 * feature. Will allow users to create, revoke, and manage API keys
 * for programmatic access to DocuConversion.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Key,
  Sparkles,
  ArrowLeft,
  Bell,
  Code2,
  Shield,
  BarChart3,
} from "lucide-react";

/** Planned API key features shown on the stub page */
const PLANNED_FEATURES = [
  {
    icon: Code2,
    title: "RESTful API Access",
    description: "Integrate PDF operations directly into your applications and workflows.",
  },
  {
    icon: Shield,
    title: "Scoped Permissions",
    description: "Create keys with fine-grained access controls for each operation type.",
  },
  {
    icon: BarChart3,
    title: "Usage Analytics",
    description: "Monitor API usage, track request counts, and set rate limit alerts.",
  },
];

/**
 * API Keys stub page component.
 * Shows a centered "Coming Soon" layout with feature previews
 * and a notification signup placeholder.
 */
export default function ApiKeysPage() {
  const [notifyEmail, setNotifyEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (notifyEmail.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors duration-200 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
            <Key className="h-10 w-10 text-indigo-400" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Manage API Keys
          </h1>

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400 ring-1 ring-blue-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            Coming Soon
          </span>

          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-gray-400">
            Access the DocuConversion API to integrate PDF conversion, editing,
            and organization into your own applications. Create and manage
            API keys with scoped permissions and usage tracking.
          </p>
        </div>

        {/* Planned features */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {PLANNED_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 backdrop-blur-sm"
            >
              <feature.icon className="mb-3 h-6 w-6 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Notification signup */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-8 text-center backdrop-blur-sm">
          <Bell className="mx-auto mb-4 h-6 w-6 text-gray-400" />
          <h2 className="text-lg font-semibold text-white">
            Get notified when available
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            We will let you know as soon as API access is ready.
          </p>

          {subscribed ? (
            <p className="mt-6 text-sm font-medium text-green-400">
              You will be notified when API keys are available.
            </p>
          ) : (
            <form
              onSubmit={handleNotify}
              className="mx-auto mt-6 flex max-w-md gap-3"
            >
              <input
                type="email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-500"
              >
                Notify me
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
