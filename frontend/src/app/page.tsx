/**
 * Landing page for DocuConversion.
 * Displays the hero section, tool grid, and value propositions.
 * This is the first page users see — optimized for conversion and SEO.
 */

import Link from "next/link";
import {
  FileText,
  ArrowRightLeft,
  Pencil,
  FolderOpen,
  PenTool,
  Shield,
  Zap,
  Lock,
  Unlock,
  Merge,
  Scissors,
  Minimize2,
  Image,
  FileSpreadsheet,
  Presentation,
  ChevronRight,
  Sparkles,
  MessageSquare,
  GitCompare,
} from "lucide-react";

/** Tool categories displayed on the landing page */
const TOOL_CATEGORIES = [
  {
    title: "Convert",
    description: "PDF to Word, Excel, PowerPoint, Images and more",
    icon: ArrowRightLeft,
    href: "/tools/convert",
    gradient: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-400",
  },
  {
    title: "Edit",
    description: "Add text, images, shapes, and annotations",
    icon: Pencil,
    href: "/tools/edit",
    gradient: "from-purple-500/20 to-purple-600/5",
    iconColor: "text-purple-400",
  },
  {
    title: "Organize",
    description: "Merge, split, compress, rotate, and reorder",
    icon: FolderOpen,
    href: "/tools/organize",
    gradient: "from-green-500/20 to-green-600/5",
    iconColor: "text-green-400",
  },
  {
    title: "Sign",
    description: "Add electronic signatures to any document",
    icon: PenTool,
    href: "/tools/sign",
    gradient: "from-orange-500/20 to-orange-600/5",
    iconColor: "text-orange-400",
  },
  {
    title: "Secure",
    description: "Protect, unlock, and redact sensitive content",
    icon: Shield,
    href: "/tools/secure",
    gradient: "from-red-500/20 to-red-600/5",
    iconColor: "text-red-400",
  },
  {
    title: "AI",
    description: "Summarize, chat, extract data, and OCR",
    icon: Sparkles,
    href: "/tools/ai",
    gradient: "from-indigo-500/20 to-indigo-600/5",
    iconColor: "text-indigo-400",
  },
] as const;

/** Popular tools grouped by category */
const POPULAR_TOOLS = [
  {
    category: "Convert",
    tools: [
      { name: "PDF to Word", href: "/tools/convert/pdf-to-word", icon: FileText, color: "text-blue-400" },
      { name: "PDF to Excel", href: "/tools/convert/pdf-to-excel", icon: FileSpreadsheet, color: "text-blue-400" },
      { name: "PDF to PowerPoint", href: "/tools/convert/pdf-to-powerpoint", icon: Presentation, color: "text-blue-400" },
      { name: "PDF to Image", href: "/tools/convert/pdf-to-image", icon: Image, color: "text-blue-400" },
      { name: "Word to PDF", href: "/tools/convert/word-to-pdf", icon: FileText, color: "text-blue-400" },
      { name: "Excel to PDF", href: "/tools/convert/excel-to-pdf", icon: FileSpreadsheet, color: "text-blue-400" },
      { name: "PowerPoint to PDF", href: "/tools/convert/pptx-to-pdf", icon: Presentation, color: "text-blue-400" },
    ],
  },
  {
    category: "Organize",
    tools: [
      { name: "Merge PDF", href: "/tools/organize/merge", icon: Merge, color: "text-green-400" },
      { name: "Split PDF", href: "/tools/organize/split", icon: Scissors, color: "text-green-400" },
      { name: "Compress PDF", href: "/tools/organize/compress", icon: Minimize2, color: "text-green-400" },
    ],
  },
  {
    category: "Edit & More",
    tools: [
      { name: "Edit PDF", href: "/tools/edit/edit-pdf", icon: Pencil, color: "text-purple-400" },
      { name: "Add Watermark", href: "/tools/edit/add-watermark", icon: Zap, color: "text-purple-400" },
      { name: "Sign PDF", href: "/tools/sign/sign-pdf", icon: PenTool, color: "text-orange-400" },
      { name: "Protect PDF", href: "/tools/secure/protect", icon: Lock, color: "text-red-400" },
      { name: "Unlock PDF", href: "/tools/secure/unlock", icon: Unlock, color: "text-red-400" },
    ],
  },
  {
    category: "AI & Advanced",
    tools: [
      { name: "Summarize PDF", href: "/tools/ai/summarize", icon: Sparkles, color: "text-indigo-400" },
      { name: "Chat with PDF", href: "/tools/ai/chat", icon: MessageSquare, color: "text-indigo-400" },
      { name: "Compare PDFs", href: "/tools/advanced/compare", icon: GitCompare, color: "text-amber-400" },
    ],
  },
] as const;

/**
 * Landing page component for DocuConversion.
 * Renders the hero section, tool category grid, and value proposition cards.
 */
export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        {/* Animated gradient blob */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
        >
          <div className="h-[500px] w-[700px] animate-pulse rounded-full bg-gradient-to-tr from-blue-600/15 via-violet-600/10 to-transparent blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-28 text-center sm:px-6 sm:py-36 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            All your PDF tools in{" "}
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              one place
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-400 sm:text-xl">
            Convert, edit, sign, and organize PDFs. Free, fast, private.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/tools/convert"
              className="rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-600/30"
            >
              Get started — it&apos;s free
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-gray-700 px-8 py-4 text-base font-medium text-gray-300 transition-all duration-200 hover:border-gray-500 hover:bg-gray-800/50 hover:text-white"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-8 text-sm text-gray-500">
            No account required &middot; Files auto-deleted &middot; 100% free for basic use
          </p>
        </div>
      </section>

      {/* Tool Categories Grid */}
      <section className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-center text-2xl font-semibold text-white">
            All PDF tools
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {TOOL_CATEGORIES.map((category) => (
              <Link
                key={category.title}
                href={category.href}
                className="group relative rounded-xl border border-gray-800/50 bg-gray-900/50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-700 hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className={`inline-flex rounded-lg bg-gradient-to-br ${category.gradient} p-3`}>
                  <category.icon className={`h-5 w-5 ${category.iconColor}`} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-white group-hover:text-blue-400 sm:text-base">
                  {category.title}
                </h3>
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  {category.description}
                </p>
                <ChevronRight className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gray-400 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Tools — Direct links grouped by category */}
      <section className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-semibold text-white">
            Popular tools
          </h2>
          <div className="grid gap-10 md:grid-cols-4">
            {POPULAR_TOOLS.map((group) => (
              <div key={group.category}>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {group.category}
                </h3>
                <div className="flex flex-col gap-2">
                  {group.tools.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="group flex items-center gap-3 rounded-lg border border-gray-800/50 bg-gray-900/30 px-4 py-3 text-sm font-medium text-gray-300 transition-all duration-200 hover:border-gray-700 hover:bg-gray-800/50 hover:text-white hover:shadow-lg hover:shadow-blue-500/5"
                    >
                      <tool.icon className={`h-4 w-4 flex-shrink-0 ${tool.color}`} />
                      <span className="flex-1">{tool.name}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-600 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-gray-400 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="bg-gradient-to-b from-gray-950 via-gray-900/80 to-gray-950 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-2xl font-semibold text-white">
            Why DocuConversion?
          </h2>
          <div className="grid gap-12 md:grid-cols-3">
            <div className="text-center">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 ring-1 ring-blue-500/20">
                  <FileText className="h-7 w-7 text-blue-400" />
                </div>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">No account needed</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                Start converting and editing instantly. Create an account only when you need more.
              </p>
              <p className="mt-4 text-2xl font-bold text-white">
                10,000+
                <span className="ml-1 text-sm font-normal text-gray-500">conversions</span>
              </p>
            </div>
            <div className="text-center">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-green-500/10 blur-xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
                  <Shield className="h-7 w-7 text-green-400" />
                </div>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">Privacy first</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                Files auto-deleted after processing. Your documents stay yours.
              </p>
              <p className="mt-4 text-2xl font-bold text-white">
                0
                <span className="ml-1 text-sm font-normal text-gray-500">files stored</span>
              </p>
            </div>
            <div className="text-center">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-violet-500/10 blur-xl" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10 ring-1 ring-violet-500/20">
                  <ArrowRightLeft className="h-7 w-7 text-violet-400" />
                </div>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">All-in-one</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                Convert, edit, sign, organize, and secure — no more tool-hopping.
              </p>
              <p className="mt-4 text-2xl font-bold text-white">
                30+
                <span className="ml-1 text-sm font-normal text-gray-500">PDF tools</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
