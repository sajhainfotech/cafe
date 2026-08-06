"use client";

import TablePagination from "@mui/material/TablePagination";

export default function CustomPagination({
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
  totalCount,
}) {
  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  return (
    <TablePagination
      component="div"
      count={totalCount}
      page={page - 1}
      rowsPerPage={rowsPerPage}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      rowsPerPageOptions={[10, 25, 50, 100]}
    />
  );
}
