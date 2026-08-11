"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ROWS_OPTIONS = [10, 25, 50, 100];

/**
 * Replaces MUI's TablePagination, which was the only reason @mui/material and
 * @emotion were in the bundle and never matched the rest of the UI.
 *
 * `page` is 1-based. If the row count shrinks below the current page (after a
 * delete or a filter), this snaps back to the last valid page rather than
 * showing an empty table.
 */
export default function Pagination({
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  totalCount = 0,
  className,
}) {
  const lastPage = Math.max(1, Math.ceil(totalCount / rowsPerPage));

  useEffect(() => {
    if (page > lastPage) setPage(lastPage);
  }, [page, lastPage, setPage]);

  const first = totalCount === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const last = Math.min(page * rowsPerPage, totalCount);

  const pageNumbers = buildPageList(page, lastPage);

  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <p className="text-xs text-ink-500 tabular-nums">
          {totalCount === 0 ? (
            "No rows"
          ) : (
            <>
              <span className="font-semibold text-ink-700">
                {first}–{last}
              </span>{" "}
              of <span className="font-semibold text-ink-700">{totalCount}</span>
            </>
          )}
        </p>

        <label className="flex items-center gap-1.5 text-xs text-ink-500">
          <span className="hidden sm:inline">Rows</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="h-7 rounded-md border border-ink-300 bg-white pl-2 pr-6 text-xs font-medium text-ink-700 cursor-pointer hover:border-ink-400 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b766f%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:14px] bg-[right_0.375rem_center] bg-no-repeat"
          >
            {ROWS_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav
        aria-label="Pagination"
        className="flex items-center gap-1 self-end sm:self-auto"
      >
        <PageButton
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </PageButton>

        {pageNumbers.map((n, i) =>
          n === "…" ? (
            <span
              key={`gap-${i}`}
              className="px-1 text-xs text-ink-400 select-none"
            >
              …
            </span>
          ) : (
            <PageButton
              key={n}
              onClick={() => setPage(n)}
              active={n === page}
              label={`Page ${n}`}
            >
              {n}
            </PageButton>
          ),
        )}

        <PageButton
          onClick={() => setPage(page + 1)}
          disabled={page >= lastPage}
          label="Next page"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </PageButton>
      </nav>
    </div>
  );
}

function PageButton({ children, onClick, disabled, active, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-md text-xs font-semibold",
        "transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none",
        active
          ? "bg-brand-600 text-white shadow-card"
          : "text-ink-600 border border-ink-200 bg-white hover:bg-ink-50 hover:border-ink-300",
      )}
    >
      {children}
    </button>
  );
}

/** 1 … 4 [5] 6 … 12 — never more than 7 slots wide. */
function buildPageList(page, lastPage) {
  if (lastPage <= 7) {
    return Array.from({ length: lastPage }, (_, i) => i + 1);
  }
  const pages = new Set([1, lastPage, page, page - 1, page + 1]);
  const sorted = [...pages].filter((n) => n >= 1 && n <= lastPage).sort((a, b) => a - b);

  const out = [];
  let previous = 0;
  for (const n of sorted) {
    if (previous && n - previous > 1) out.push("…");
    out.push(n);
    previous = n;
  }
  return out;
}
