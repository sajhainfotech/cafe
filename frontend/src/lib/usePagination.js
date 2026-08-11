"use client";

import { useMemo } from "react";

/**
 * Client-side pagination for pages whose API returns the whole list.
 *
 * The old pages rendered <CustomPagination> next to a table that received the
 * full unsliced array, so changing page or rows-per-page did nothing visible.
 * Pass the filtered rows through here and render `rows`.
 */
export function usePaginatedRows(allRows, page, rowsPerPage) {
  return useMemo(() => {
    const total = allRows.length;
    const lastPage = Math.max(1, Math.ceil(total / rowsPerPage));
    const safePage = Math.min(Math.max(1, page), lastPage);
    const start = (safePage - 1) * rowsPerPage;

    return {
      rows: allRows.slice(start, start + rowsPerPage),
      total,
      lastPage,
    };
  }, [allRows, page, rowsPerPage]);
}
