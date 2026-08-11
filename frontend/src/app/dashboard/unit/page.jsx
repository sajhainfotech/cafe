"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Boxes, Pencil, Plus, Trash2 } from "lucide-react";

import PageShell, { PageHeader } from "@/components/ui/PageShell";
import DataTable, { RowActions } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import Button, { IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { authHeader, getAuthToken } from "@/lib/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminMenuUnitPage() {
  const [units, setUnits] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [unitName, setUnitName] = useState("");
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // This endpoint paginates server-side, so page/rowsPerPage go in the query
  // and the response count drives the pager.
  const fetchUnits = async () => {
    if (!getAuthToken()) return;
    setFetching(true);
    try {
      const res = await fetch(
        `${API_URL}/api/units/?page=${page}&page_size=${rowsPerPage}`,
        { headers: authHeader() },
      );
      const data = await res.json();
      setUnits(data.data?.results || []);
      setTotalCount(data.data?.count || 0);
    } catch {
      toast.error("Failed to load units");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const visibleUnits = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return units;
    return units.filter((u) => u.name?.toLowerCase().includes(q));
  }, [units, search]);

  const validate = () => {
    const name = unitName.trim();
    if (!name) {
      setError("Unit name is required");
      return false;
    }
    if (
      units.some(
        (u) =>
          u.name?.toLowerCase() === name.toLowerCase() &&
          u.reference_id !== editId,
      )
    ) {
      setError("A unit with this name already exists");
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
      const res = await fetch(
        editId ? `${API_URL}/api/units/${editId}/` : `${API_URL}/api/units/`,
        {
          method: editId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({ name: unitName.trim() }),
        },
      );
      if (!res.ok) throw new Error("Failed to save unit");

      toast.success(editId ? "Unit updated" : "Unit created");
      closeForm();
      fetchUnits();
    } catch (err) {
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
        `${API_URL}/api/units/${pendingDelete.reference_id}/`,
        { method: "DELETE", headers: authHeader() },
      );
      if (!res.ok) throw new Error("Could not delete this unit");

      toast.success("Unit deleted");
      fetchUnits();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setUnitName("");
    setError("");
    setShowForm(true);
  };

  const openEdit = (unit) => {
    setEditId(unit.reference_id);
    setUnitName(unit.name ?? "");
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setUnitName("");
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
      header: "Unit name",
      render: (row) => (
        <span className="font-semibold text-ink-900">{row.name}</span>
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
            label={`Edit ${row.name}`}
            size="sm"
            onClick={() => openEdit(row)}
            variant="ghost-brand"
          />
          <IconButton
            icon={Trash2}
            label={`Delete ${row.name}`}
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
        title="Units"
        subtitle="How menu items are measured — plate, cup, kg, piece."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search units…"
        action={
          <Button icon={Plus} onClick={openCreate}>
            New unit
          </Button>
        }
      />

      <DataTable
        data={visibleUnits}
        columns={columns}
        loading={fetching}
        searchQuery={search}
        onClearSearch={() => setSearch("")}
        emptyIcon={Boxes}
        emptyTitle="No units yet"
        emptyDescription="Every menu item needs a unit — add your first one."
        emptyAction={
          <Button icon={Plus} size="sm" onClick={openCreate}>
            New unit
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
        title={editId ? "Edit unit" : "New unit"}
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
              form="unit-form"
            >
              {editId ? "Update unit" : "Create unit"}
            </Button>
          </>
        }
      >
        <form id="unit-form" onSubmit={handleSubmit} noValidate>
          <Field label="Unit name" required error={error}>
            {(props) => (
              <Input
                {...props}
                value={unitName}
                onChange={(e) => {
                  setUnitName(e.target.value);
                  if (error) setError("");
                }}
                placeholder="e.g. Plate, Cup, Kg"
              />
            )}
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        itemName={pendingDelete?.name}
        loading={deleting}
        title="Delete unit"
      />
    </PageShell>
  );
}
