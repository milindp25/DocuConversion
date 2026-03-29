/**
 * Displays AI-extracted data from a PDF in a tabbed interface.
 * Shows three tabs: Tables, Key-Values, and Entities,
 * each with appropriate rendering and empty states.
 */

"use client";

import { useState } from "react";

import { Table2, ListOrdered, Tags } from "lucide-react";

import { cn } from "@/lib/utils";

/** A single extracted table with headers and rows */
export interface ExtractedTable {
  /** Optional table title or caption */
  title?: string;
  /** Column header labels */
  headers: string[];
  /** Row data — each row is an array of cell values */
  rows: string[][];
}

/** A key-value pair extracted from the document */
export interface ExtractedKeyValue {
  /** The field label or key */
  key: string;
  /** The extracted value */
  value: string;
}

/** A named entity extracted from the document */
export interface ExtractedEntity {
  /** The entity text (e.g., "Acme Corp") */
  text: string;
  /** The entity type (e.g., "ORGANIZATION", "DATE", "PERSON") */
  type: string;
}

/** Props for the ExtractionResult component */
export interface ExtractionResultProps {
  /** Extracted tables from the document */
  tables: ExtractedTable[];
  /** Extracted key-value pairs */
  keyValues: ExtractedKeyValue[];
  /** Extracted named entities */
  entities: ExtractedEntity[];
}

/** Tab configuration for the extraction results */
const TABS = [
  { id: "tables", label: "Tables", icon: Table2 },
  { id: "key-values", label: "Key-Values", icon: ListOrdered },
  { id: "entities", label: "Entities", icon: Tags },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Color mapping for entity types */
const ENTITY_COLORS: Record<string, string> = {
  PERSON: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-400/30",
  ORGANIZATION: "bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-950 dark:text-purple-300 dark:ring-purple-400/30",
  DATE: "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-950 dark:text-green-300 dark:ring-green-400/30",
  LOCATION: "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-400/30",
  MONEY: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-400/30",
  PERCENT: "bg-cyan-50 text-cyan-700 ring-cyan-600/20 dark:bg-cyan-950 dark:text-cyan-300 dark:ring-cyan-400/30",
};

/** Default color for unknown entity types */
const DEFAULT_ENTITY_COLOR =
  "bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-400/30";

/**
 * ExtractionResult renders AI-extracted data in a tabbed interface
 * with Tables, Key-Values, and Entities views.
 *
 * @example
 * ```tsx
 * <ExtractionResult
 *   tables={[{ headers: ["Name", "Value"], rows: [["Total", "$100"]] }]}
 *   keyValues={[{ key: "Invoice #", value: "12345" }]}
 *   entities={[{ text: "Acme Corp", type: "ORGANIZATION" }]}
 * />
 * ```
 */
export function ExtractionResult({
  tables,
  keyValues,
  entities,
}: ExtractionResultProps) {
  const [activeTab, setActiveTab] = useState<TabId>("tables");

  /** Groups entities by their type for organized display */
  const groupedEntities = entities.reduce<Record<string, ExtractedEntity[]>>(
    (acc, entity) => {
      const group = acc[entity.type] || [];
      group.push(entity);
      acc[entity.type] = group;
      return acc;
    },
    {}
  );

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      role="region"
      aria-label="Extraction results"
    >
      {/* Tab bar */}
      <div
        className="flex border-b border-gray-200 dark:border-gray-700"
        role="tablist"
        aria-label="Extraction result tabs"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500",
              activeTab === tab.id
                ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            )}
          >
            <tab.icon className="h-4 w-4" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="p-5">
        {/* Tables panel */}
        <div
          id="tabpanel-tables"
          role="tabpanel"
          aria-labelledby="tab-tables"
          hidden={activeTab !== "tables"}
        >
          {tables.length === 0 ? (
            <EmptyState message="No tables found in this document." />
          ) : (
            <div className="space-y-6">
              {tables.map((table, tableIndex) => (
                <div key={tableIndex} className="overflow-x-auto">
                  {table.title && (
                    <h4 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {table.title}
                    </h4>
                  )}
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        {table.headers.map((header, i) => (
                          <th
                            key={i}
                            scope="col"
                            className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                        >
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-3 py-2 text-gray-600 dark:text-gray-400"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Key-Values panel */}
        <div
          id="tabpanel-key-values"
          role="tabpanel"
          aria-labelledby="tab-key-values"
          hidden={activeTab !== "key-values"}
        >
          {keyValues.length === 0 ? (
            <EmptyState message="No key-value pairs found in this document." />
          ) : (
            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              {keyValues.map((kv, index) => (
                <div
                  key={index}
                  className="flex items-baseline justify-between gap-4 py-2.5"
                >
                  <dt className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {kv.key}
                  </dt>
                  <dd className="text-sm text-gray-600 dark:text-gray-400">
                    {kv.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Entities panel */}
        <div
          id="tabpanel-entities"
          role="tabpanel"
          aria-labelledby="tab-entities"
          hidden={activeTab !== "entities"}
        >
          {entities.length === 0 ? (
            <EmptyState message="No named entities found in this document." />
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedEntities).map(([type, typeEntities]) => (
                <div key={type}>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {type}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {typeEntities.map((entity, index) => (
                      <span
                        key={index}
                        className={cn(
                          "inline-flex rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                          ENTITY_COLORS[type] || DEFAULT_ENTITY_COLOR
                        )}
                      >
                        {entity.text}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Empty state placeholder for tabs with no data */
function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
      {message}
    </p>
  );
}
