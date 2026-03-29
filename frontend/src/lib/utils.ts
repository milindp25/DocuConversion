/**
 * Utility functions shared across the DocuConversion frontend.
 * Includes class name merging for Tailwind CSS components.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names, resolving conflicts intelligently.
 * Uses clsx for conditional classes and tailwind-merge for deduplication.
 *
 * @param inputs - Class values to merge (strings, arrays, objects)
 * @returns Merged class string with conflicts resolved
 *
 * @example
 * cn("px-4 py-2", "px-6") // => "px-6 py-2"
 * cn("text-red-500", isActive && "text-blue-500") // conditional
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
