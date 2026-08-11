"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Store, Trash2 } from "lucide-react";

import PageShell, { PageHeader } from "@/components/ui/PageShell";
import DataTable, { RowActions } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import Button, { IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { authHeader, getAuthToken } from "@/lib/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const EMPTY_FORM = { name: "", address: "", mobile_number: "" };

export default function RestaurantPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRestaurants = async () => {
    if (!getAuthToken()) return;
    setFetching(true);
    try {
      const res = await fetch(
        `${API_URL}/api/restaurants/?page=${page}&page_size=${rowsPerPage}`,
        { headers: authHeader() },
      );
      const data = await res.json();
      setRestaurants(data.data?.results || []);
      setTotalCount(data.data?.count || 0);
    } catch {
      toast.error("Failed to load restaurants");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!Array.isArray(restaurants)) return [];
    if (!q) return restaurants;
    return restaurants.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.address?.toLowerCase().includes(q) ||
        r.mobile_number?.includes(q),
    );
  }, [restaurants, search]);

  const validate = () => {
    const next = {};
    const name = form.name.trim();
    const address = form.address.trim();
    const mobile = form.mobile_number.trim();

    if (!name) next.name = "Restaurant name is required";
    else if (name.length < 2) next.name = "Name must be at least 2 characters";
    else if (name.length > 100) next.name = "Name must be under 100 characters";
    else if (
      restaurants.some(
        (r) =>
          r.name?.toLowerCase() === name.toLowerCase() &&
          r.reference_id !== editId,
      )
    )
      next.name = "A restaurant with this name already exists";

    if (!address) next.address = "Address is required";
    else if (address.length < 5)
      next.address = "Address must be at least 5 characters";
    else if (address.length > 200)
      next.address = "Address must be under 200 characters";

    if (!mobile) next.mobile_number = "Mobile number is required";
    else if (!/^\d{10}$/.test(mobile))
      next.mobile_number = "Enter a 10-digit mobile number";
    else if (
      restaurants.some(
        (r) => r.mobile_number === mobile && r.reference_id !== editId,
      )
    )
      next.mobile_number = "This mobile number is already registered";

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
          ? `${API_URL}/api/restaurants/${editId}/`
          : `${API_URL}/api/restaurants/`,
        {
          method: editId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({
            name: form.name.trim(),
            address: form.address.trim(),
            mobile_number: form.mobile_number.trim(),
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to save restaurant");

      toast.success(editId ? "Restaurant updated" : "Restaurant created");
      closeForm();
      fetchRestaurants();
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
        `${API_URL}/api/restaurants/${pendingDelete.reference_id}/`,
        { method: "DELETE", headers: authHeader() },
      );
      if (!res.ok) throw new Error("Could not delete this restaurant");

      toast.success("Restaurant deleted");
      fetchRestaurants();
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

  const openEdit = (restaurant) => {
    setEditId(restaurant.reference_id);
    setForm({
      name: restaurant.name ?? "",
      address: restaurant.address ?? "",
      mobile_number: restaurant.mobile_number ?? "",
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

  const update = (key) => (e) => {
    const value =
      key === "mobile_number"
        ? e.target.value.replace(/\D/g, "").slice(0, 10)
        : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
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
      header: "Restaurant",
      render: (row) => (
        <span className="font-semibold text-ink-900">{row.name}</span>
      ),
    },
    {
      header: "Address",
      render: (row) => row.address || <span className="text-ink-400">—</span>,
    },
    {
      header: "Phone",
      render: (row) => (
        <span className="tabular-nums text-ink-700">
          {row.mobile_number || "—"}
        </span>
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
        title="Restaurants"
        subtitle="Every branch and user belongs to one of these."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search restaurants…"
        action={
          <Button icon={Plus} onClick={openCreate}>
            New restaurant
          </Button>
        }
      />

      <DataTable
        data={visible}
        columns={columns}
        loading={fetching}
        searchQuery={search}
        onClearSearch={() => setSearch("")}
        emptyIcon={Store}
        emptyTitle="No restaurants yet"
        emptyDescription="Add a restaurant before creating branches or users."
        emptyAction={
          <Button icon={Plus} size="sm" onClick={openCreate}>
            New restaurant
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
        title={editId ? "Edit restaurant" : "New restaurant"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              size="sm"
              loading={saving}
              type="submit"
              form="restaurant-form"
            >
              {editId ? "Update restaurant" : "Create restaurant"}
            </Button>
          </>
        }
      >
        <form
          id="restaurant-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          <Field label="Restaurant name" required error={errors.name}>
            {(props) => (
              <Input
                {...props}
                value={form.name}
                onChange={update("name")}
                placeholder="e.g. Yoho Pure Bites"
              />
            )}
          </Field>

          <Field label="Address" required error={errors.address}>
            {(props) => (
              <Input
                {...props}
                value={form.address}
                onChange={update("address")}
                placeholder="Street, city"
              />
            )}
          </Field>

          <Field
            label="Mobile number"
            required
            error={errors.mobile_number}
            hint={
              form.mobile_number
                ? `${form.mobile_number.length}/10 digits`
                : "10 digits, numbers only."
            }
          >
            {(props) => (
              <Input
                {...props}
                inputMode="numeric"
                maxLength={10}
                value={form.mobile_number}
                onChange={update("mobile_number")}
                placeholder="98XXXXXXXX"
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
        title="Delete restaurant"
      />
    </PageShell>
  );
}
