"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";

import PageShell, { PageHeader } from "@/components/ui/PageShell";
import DataTable, { RowActions } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import Button, { IconButton } from "@/components/ui/Button";
import { CharCount, Field, Input, Textarea } from "@/components/ui/Field";
import { authHeader, getAuthToken } from "@/lib/cookies";
import { usePaginatedRows } from "@/lib/usePagination";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const DESCRIPTION_MAX = 500;

const EMPTY_FORM = { name: "", description: "" };

export default function AdminCategoryManager() {
  const [categories, setCategories] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      if (!getAuthToken()) return;
      const res = await fetch(`${API_URL}/api/item-categories/`, {
        headers: authHeader(),
      });
      const data = await res.json();
      setCategories(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load categories");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q),
    );
  }, [categories, search]);

  // The old page passed the full list to the table while rendering a pager
  // beside it, so changing page did nothing. Slice before rendering.
  const { rows, total } = usePaginatedRows(filtered, page, rowsPerPage);

  useEffect(() => setPage(1), [search]);

  const validate = () => {
    const next = {};
    const name = form.name.trim();

    if (!name) {
      next.name = "Category name is required";
    } else if (
      categories.some(
        (c) =>
          c.name?.toLowerCase() === name.toLowerCase() &&
          c.reference_id !== editId,
      )
    ) {
      next.name = "A category with this name already exists";
    }

    if (form.description.length > DESCRIPTION_MAX) {
      next.description = `Description must be under ${DESCRIPTION_MAX} characters`;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch(
        editId
          ? `${API_URL}/api/item-categories/${editId}/`
          : `${API_URL}/api/item-categories/`,
        {
          method: editId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim(),
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save category");

      toast.success(editId ? "Category updated" : "Category created");
      closeForm();
      fetchCategories();
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
        `${API_URL}/api/item-categories/${pendingDelete.reference_id}/`,
        { method: "DELETE", headers: authHeader() },
      );
      if (!res.ok) throw new Error("Could not delete this category");

      toast.success("Category deleted");
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (category) => {
    setEditId(category.reference_id);
    setForm({
      name: category.name ?? "",
      description: category.description ?? "",
    });
    setErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setErrors({});
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
      header: "Name",
      render: (row) => (
        <span className="font-semibold text-ink-900">{row.name}</span>
      ),
    },
    {
      header: "Description",
      render: (row) =>
        row.description ? (
          <span className="text-ink-600">{row.description}</span>
        ) : (
          <span className="text-ink-400">—</span>
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
        title="Categories"
        subtitle="Group menu items so customers can find them quickly."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search categories…"
        action={
          <Button icon={Plus} onClick={openCreate}>
            New category
          </Button>
        }
      />

      <DataTable
        data={rows}
        columns={columns}
        loading={fetching}
        searchQuery={search}
        onClearSearch={() => setSearch("")}
        emptyIcon={Tag}
        emptyTitle="No categories yet"
        emptyDescription="Categories organise your menu — add one to get started."
        emptyAction={
          <Button icon={Plus} size="sm" onClick={openCreate}>
            New category
          </Button>
        }
      />

      {total > 0 && (
        <Pagination
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          totalCount={total}
        />
      )}

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editId ? "Edit category" : "New category"}
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={saving}
              type="submit"
              form="category-form"
            >
              {editId ? "Update category" : "Create category"}
            </Button>
          </>
        }
      >
        <form
          id="category-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          <Field label="Name" required error={errors.name}>
            {(props) => (
              <Input
                {...props}
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="e.g. Beverages"
              />
            )}
          </Field>

          <Field
            label="Description"
            error={errors.description}
            hint="Optional — shown to staff, not customers."
          >
            {(props) => (
              <>
                <Textarea
                  {...props}
                  value={form.description}
                  onChange={(e) => {
                    setForm({ ...form, description: e.target.value });
                    if (errors.description)
                      setErrors({ ...errors, description: "" });
                  }}
                  placeholder="Hot and cold drinks"
                  rows={3}
                />
                <CharCount value={form.description} max={DESCRIPTION_MAX} />
              </>
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
        title="Delete category"
      />
    </PageShell>
  );
}
