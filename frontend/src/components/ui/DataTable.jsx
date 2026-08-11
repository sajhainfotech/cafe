"use client";

import { cn } from "@/lib/utils";
import EmptyState from "./EmptyState";

/**
 * Table for admin lists.
 *
 * Column shape (unchanged from the old CustomTable, so existing column
 * definitions keep working):
 *   { header, width?, render?(row, index), accessor?, align?, className? }
 *
 * The header is sticky against the page's scroll container, so wrap pages in
 * PageShell and let <main> own the scrolling — no inner scrollbar, no
 * calc(100vh - magic) height.
 */
export default function DataTable({
  data = [],
  columns = [],
  loading = false,
  skeletonRows = 8,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyIcon,
  emptyAction,
  searchQuery = "",
  onClearSearch,
  rowKey = (row, i) => row.reference_id ?? row.id ?? i,
  onRowClick,
  className,
}) {
  const isSearching = Boolean(searchQuery);
  const showEmpty = !loading && data.length === 0;

  const alignClass = (align) =>
    align === "right"
      ? "text-right"
      : align === "center"
        ? "text-center"
        : "text-left";

  return (
    <div
      className={cn(
        "bg-white border border-ink-300 rounded-xl shadow-card overflow-hidden",
        className,
      )}
    >
      <div className="overflow-x-auto scrollbar-slim">
        <table className="w-full min-w-max border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-ink-50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    "px-3.5 py-2.5 text-2xs font-bold uppercase tracking-wider text-ink-600",
                    "border-b border-ink-300 whitespace-nowrap",
                    alignClass(col.align),
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }).map((_, r) => (
                  <tr key={r} className="border-b border-ink-200 last:border-0">
                    {columns.map((col, c) => (
                      <td key={c} className="px-3.5 py-2.5">
                        <div
                          className="h-3.5 rounded bg-ink-100 animate-pulse"
                          style={{ width: `${55 + ((c * 17) % 40)}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((row, index) => (
                  <tr
                    key={rowKey(row, index)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-ink-200 last:border-0 transition-colors",
                      // Clearly visible mint tint on hover — the previous
                      // brand-50/60 was almost indistinguishable from white.
                      "hover:bg-brand-100/70",
                      onRowClick && "cursor-pointer",
                    )}
                  >
                    {columns.map((col, i) => (
                      <td
                        key={i}
                        className={cn(
                          "px-3.5 py-2.5 text-sm text-ink-800 align-middle",
                          alignClass(col.align),
                          col.className,
                        )}
                      >
                        {col.render
                          ? col.render(row, index)
                          : (row[col.accessor] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {showEmpty && (
        <EmptyState
          icon={emptyIcon}
          title={isSearching ? "No matches" : emptyTitle}
          description={
            isSearching
              ? `Nothing matched “${searchQuery}”. Try a different spelling.`
              : emptyDescription
          }
          action={
            isSearching
              ? onClearSearch && (
                  <button
                    type="button"
                    onClick={onClearSearch}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2 cursor-pointer"
                  >
                    Clear search
                  </button>
                )
              : emptyAction
          }
        />
      )}
    </div>
  );
}

/** Right-aligned row-action cluster, so every table's actions look the same. */
export function RowActions({ children, className }) {
  return (
    <div className={cn("flex items-center justify-end gap-1", className)}>
      {children}
    </div>
  );
}
