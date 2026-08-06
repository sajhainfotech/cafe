"use client";

export default function CustomTable({
  data = [],
  columns = [],
  emptyMessage = "No data found",
  searchQuery = "",
}) {
  return (
    <div className="flex-1 min-h-0 bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden flex flex-col">
      <div
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ maxHeight: "calc(100vh - 150px)" }}
      >
        <table className="min-w-full border-separate border-spacing-0 table-fixed text-[11px]">
          <thead className="sticky top-0 bg-[#fafafa] z-10">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700 last:border-r-0"
                  style={{ width: col.width || "auto" }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-8 text-gray-400 border-b border-gray-300"
                >
                  {searchQuery ? "No results match your search" : emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.reference_id || index}
                  className="hover:bg-blue-50/30 transition-all"
                >
                  {columns.map((col, i) => (
                    <td
                      key={i}
                      className="border-b border-r border-gray-300 px-2 py-0.5 last:border-r-0"
                    >
                      {col.render ? col.render(row, index) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
