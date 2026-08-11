"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Download, Pencil, Plus, QrCode, Trash2 } from "lucide-react";

import PageShell, { PageHeader } from "@/components/ui/PageShell";
import DataTable, { RowActions } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import Button, { IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { authHeader, getAuthToken } from "@/lib/cookies";
import { generateTableQR } from "@/lib/generateTableQR.js";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TableManager() {
  const [tables, setTables] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [tableNumber, setTableNumber] = useState("");
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [qrTable, setQrTable] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTables = async () => {
    if (!getAuthToken()) return;
    setFetching(true);
    try {
      const res = await fetch(
        `${API_URL}/api/tables/?page=${page}&page_size=${rowsPerPage}`,
        { headers: authHeader() },
      );
      const data = await res.json();
      if (!res.ok || data.response_code !== "0") {
        throw new Error(data.response || "Failed to load tables");
      }

      const withQr = await Promise.all(
        (data.data?.results || []).map(async (t) => {
          let tokenNumber = t.token;
          if (!tokenNumber && t.qr_code_url) {
            try {
              tokenNumber = new URL(t.qr_code_url).searchParams.get("token");
            } catch {
              tokenNumber = null;
            }
          }
          return {
            ...t,
            token_number: tokenNumber,
            qr_code: tokenNumber ? await generateTableQR(tokenNumber) : "",
          };
        }),
      );

      setTables(withQr);
      setTotalCount(data.data?.count || 0);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const visible = useMemo(() => {
    const q = search.trim();
    if (!q) return tables;
    return tables.filter((t) => String(t.table_number).includes(q));
  }, [tables, search]);

  const validate = () => {
    const value = tableNumber.trim();
    if (!value) {
      setError("Table number is required");
      return false;
    }
    if (
      tables.some(
        (t) =>
          String(t.table_number) === value && t.reference_id !== editId,
      )
    ) {
      setError("That table number is already taken");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const tableToken = editId
        ? tables.find((t) => t.reference_id === editId)?.token_number
        : Date.now().toString();
      const qr = tableToken ? await generateTableQR(tableToken) : "";

      const body = new FormData();
      body.append("table_number", tableNumber.trim());
      body.append("qr_code", qr);
      body.append("token", tableToken ?? "");
      if (editId) body.append("table_id", editId);

      const res = await fetch(
        editId ? `${API_URL}/api/tables/${editId}/` : `${API_URL}/api/tables/`,
        { method: editId ? "PATCH" : "POST", headers: authHeader(), body },
      );
      const data = await res.json();
      if (!res.ok || data.response_code !== "0") {
        throw new Error(data.response || "Failed to save table");
      }

      toast.success(editId ? "Table updated" : "Table created");
      closeForm();
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/tables/${pendingDelete.reference_id}/`,
        { method: "DELETE", headers: authHeader() },
      );
      if (!res.ok) throw new Error("Could not delete this table");

      toast.success("Table deleted");
      fetchTables();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setTableNumber("");
    setError("");
    setShowForm(true);
  };

  const openEdit = (table) => {
    setEditId(table.reference_id);
    setTableNumber(String(table.table_number ?? ""));
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setTableNumber("");
    setError("");
  };

  const columns = [
    {
      header: "S.N.",
      width: "68px",
      render: (_row, i) => (
        <span className="text-ink-400">{(page - 1) * rowsPerPage + i + 1}</span>
      ),
    },
    {
      header: "Table",
      render: (row) => (
        <span className="inline-flex items-center gap-2 font-semibold text-ink-900">
          <span className="grid size-7 place-items-center rounded-md bg-brand-100 text-2xs font-bold text-brand-700">
            {row.table_number}
          </span>
          Table {row.table_number}
        </span>
      ),
    },
    {
      header: "QR code",
      width: "140px",
      render: (row) =>
        row.qr_code ? (
          <button
            type="button"
            onClick={() => setQrTable(row)}
            className="inline-flex items-center gap-2 rounded-md border border-ink-200 bg-white px-2 py-1 text-2xs font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700 cursor-pointer"
          >
            <img src={row.qr_code} alt="" className="size-5" aria-hidden="true" />
            View & print
          </button>
        ) : (
          <span className="text-2xs text-ink-400">Not generated</span>
        ),
    },
    {
      header: "Actions",
      width: "96px",
      align: "right",
      render: (row) => (
        <RowActions>
          <IconButton
            icon={Pencil}
            label={`Edit table ${row.table_number}`}
            size="sm"
            onClick={() => openEdit(row)}
            variant="ghost-brand"
          />
          <IconButton
            icon={Trash2}
            label={`Delete table ${row.table_number}`}
            size="sm"
            onClick={() => setPendingDelete(row)}
            variant="ghost-danger"
          />
        </RowActions>
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Tables"
        subtitle="Each table gets a QR code customers scan to open the menu."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search table number…"
        action={
          <Button icon={Plus} onClick={openCreate}>
            New table
          </Button>
        }
      />

      <DataTable
        data={visible}
        columns={columns}
        loading={fetching}
        searchQuery={search}
        onClearSearch={() => setSearch("")}
        emptyIcon={QrCode}
        emptyTitle="No tables yet"
        emptyDescription="Add a table to generate its QR code."
        emptyAction={
          <Button icon={Plus} size="sm" onClick={openCreate}>
            New table
          </Button>
        }
      />

      {totalCount > 0 && (
        <Pagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalCount={totalCount}
        />
      )}

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editId ? "Edit table" : "New table"}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={saving}
              type="submit"
              form="table-form"
            >
              {editId ? "Update table" : "Create table"}
            </Button>
          </>
        }
      >
        <form id="table-form" onSubmit={handleSubmit} noValidate>
          <Field
            label="Table number"
            required
            error={error}
            hint="Shown to customers as “Table 4”."
          >
            {(props) => (
              <Input
                {...props}
                inputMode="numeric"
                value={tableNumber}
                onChange={(e) => {
                  setTableNumber(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. 4"
              />
            )}
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(qrTable)}
        onClose={() => setQrTable(null)}
        title={`Table ${qrTable?.table_number} QR code`}
        description="Print this and place it on the table."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setQrTable(null)}>
              Close
            </Button>
            <Button
              size="sm"
              icon={Download}
              onClick={() => {
                const link = document.createElement("a");
                link.href = qrTable.qr_code;
                link.download = `table-${qrTable.table_number}-qr.png`;
                link.click();
              }}
            >
              Download PNG
            </Button>
          </>
        }
      >
        {qrTable?.qr_code && (
          <div className="flex flex-col items-center gap-3">
            <img
              src={qrTable.qr_code}
              alt={`QR code for table ${qrTable.table_number}`}
              className="w-full max-w-56 rounded-lg border border-ink-200 p-2"
            />
            <p className="text-2xs text-ink-500">
              Scanning opens the menu for table {qrTable.table_number}.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        itemName={`Table ${pendingDelete?.table_number}`}
        loading={deleting}
        title="Delete table"
        message={
          <>
            Deleting{" "}
            <span className="font-semibold text-ink-900">
              Table {pendingDelete?.table_number}
            </span>{" "}
            invalidates its QR code — any printed copy will stop working.
          </>
        }
      />
    </PageShell>
  );
}
