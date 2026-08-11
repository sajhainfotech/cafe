"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";

import PageShell, { PageHeader } from "@/components/ui/PageShell";
import DataTable, { RowActions } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import Button, { IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import SearchSelect from "@/components/ui/SearchSelect";
import { authHeader, getAuthToken } from "@/lib/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const EMPTY_FORM = {
  name: "",
  email: "",
  address: "",
  mobile_number: "",
  restaurant_id: "",
};

export default function BranchPage() {
  const [branches, setBranches] = useState([]);
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

  const load = useCallback(async () => {
    if (!getAuthToken()) return;
    setFetching(true);
    try {
      const [restRes, branchRes] = await Promise.all([
        fetch(`${API_URL}/api/restaurants/`, { headers: authHeader() }),
        fetch(
          `${API_URL}/api/branches/?page=${page}&page_size=${rowsPerPage}`,
          { headers: authHeader() },
        ),
      ]);

      const restJson = await restRes.json();
      const branchJson = await branchRes.json();

      const restaurantList = restJson.data?.results || restJson.data || [];
      setRestaurants(restaurantList);
      setTotalCount(branchJson.data?.count || 0);

      setBranches(
        (branchJson.data?.results || []).map((b) => ({
          ...b,
          restaurant_name:
            restaurantList.find(
              (r) => r.reference_id === b.restaurant_reference_id,
            )?.name || null,
        })),
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load branches");
    } finally {
      setFetching(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    load();
  }, [load]);

  const restaurantOptions = useMemo(
    () =>
      restaurants.map((r) => ({ value: r.reference_id, label: r.name })),
    [restaurants],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) =>
      [b.name, b.email, b.address, b.mobile_number, b.restaurant_name].some(
        (field) => field?.toLowerCase?.().includes(q),
      ),
    );
  }, [branches, search]);

  const validate = () => {
    const next = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const address = form.address.trim();
    const mobile = form.mobile_number.trim();

    if (!name) next.name = "Branch name is required";
    else if (name.length < 2) next.name = "Name must be at least 2 characters";
    else if (name.length > 100) next.name = "Name must be under 100 characters";
    else if (
      branches.some(
        (b) =>
          b.name?.toLowerCase() === name.toLowerCase() &&
          b.reference_id !== editId,
      )
    )
      next.name = "A branch with this name already exists";

    if (!email) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address";
    else if (
      branches.some(
        (b) =>
          b.email?.toLowerCase() === email.toLowerCase() &&
          b.reference_id !== editId,
      )
    )
      next.email = "This email is already used by another branch";

    if (!address) next.address = "Address is required";
    else if (address.length < 5)
      next.address = "Address must be at least 5 characters";
    else if (address.length > 200)
      next.address = "Address must be under 200 characters";

    if (!mobile) next.mobile_number = "Mobile number is required";
    else if (!/^\d{10}$/.test(mobile))
      next.mobile_number = "Enter a 10-digit mobile number";
    else if (
      branches.some(
        (b) => b.mobile_number === mobile && b.reference_id !== editId,
      )
    )
      next.mobile_number = "This mobile number is already registered";

    if (!form.restaurant_id) next.restaurant_id = "Choose a restaurant";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await fetch(
        editId ? `${API_URL}/api/branches/${editId}/` : `${API_URL}/api/branches/`,
        {
          method: editId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json", ...authHeader() },
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            address: form.address.trim(),
            mobile_number: form.mobile_number.trim(),
            restaurant_id: form.restaurant_id,
          }),
        },
      );
      if (!res.ok) throw new Error("Failed to save branch");

      toast.success(editId ? "Branch updated" : "Branch created");
      closeForm();
      load();
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
        `${API_URL}/api/branches/${pendingDelete.reference_id}/`,
        { method: "DELETE", headers: authHeader() },
      );
      if (!res.ok) throw new Error("Could not delete this branch");

      toast.success("Branch deleted");
      load();
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

  const openEdit = (branch) => {
    setEditId(branch.reference_id);
    setForm({
      name: branch.name ?? "",
      email: branch.email ?? "",
      address: branch.address ?? "",
      mobile_number: branch.mobile_number ?? "",
      restaurant_id: branch.restaurant_reference_id ?? "",
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

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const update = (key) => (e) =>
    setField(
      key,
      key === "mobile_number"
        ? e.target.value.replace(/\D/g, "").slice(0, 10)
        : e.target.value,
    );

  const columns = [
    {
      header: "S.N.",
      width: "68px",
      render: (_row, i) => (
        <span className="text-ink-400">{(page - 1) * rowsPerPage + i + 1}</span>
      ),
    },
    {
      header: "Branch",
      render: (row) => (
        <span className="font-semibold text-ink-900">{row.name}</span>
      ),
    },
    {
      header: "Restaurant",
      render: (row) =>
        row.restaurant_name || <span className="text-ink-400">Unlinked</span>,
    },
    {
      header: "Contact",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate lowercase text-ink-700">{row.email || "—"}</p>
          <p className="text-2xs tabular-nums text-ink-500">
            {row.mobile_number || "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Address",
      render: (row) => row.address || <span className="text-ink-400">—</span>,
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
        title="Branches"
        subtitle="Locations belonging to each restaurant."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search branches…"
        action={
          <Button icon={Plus} onClick={openCreate}>
            New branch
          </Button>
        }
      />

      <DataTable
        data={visible}
        columns={columns}
        loading={fetching}
        searchQuery={search}
        onClearSearch={() => setSearch("")}
        emptyIcon={Building2}
        emptyTitle="No branches yet"
        emptyDescription="Add a branch and link it to a restaurant."
        emptyAction={
          <Button icon={Plus} size="sm" onClick={openCreate}>
            New branch
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
        title={editId ? "Edit branch" : "New branch"}
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
              form="branch-form"
            >
              {editId ? "Update branch" : "Create branch"}
            </Button>
          </>
        }
      >
        <form
          id="branch-form"
          onSubmit={handleSubmit}
          className="space-y-4"
          noValidate
        >
          {/* Was an antd <Select showSearch>, the last thing keeping antd in the
              bundle and the only control on the page with its own look. */}
          <Field label="Restaurant" required error={errors.restaurant_id}>
            {({ invalid, ...props }) => (
              <SearchSelect
                {...props}
                invalid={invalid}
                value={form.restaurant_id}
                onChange={(value) => setField("restaurant_id", value)}
                options={restaurantOptions}
                placeholder="Choose a restaurant"
                searchPlaceholder="Search restaurants…"
              />
            )}
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Branch name" required error={errors.name}>
              {(props) => (
                <Input
                  {...props}
                  value={form.name}
                  onChange={update("name")}
                  placeholder="e.g. Lakeside"
                />
              )}
            </Field>

            <Field label="Email" required error={errors.email}>
              {(props) => (
                <Input
                  {...props}
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder="branch@example.com"
                />
              )}
            </Field>
          </div>

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
        title="Delete branch"
      />
    </PageShell>
  );
}
