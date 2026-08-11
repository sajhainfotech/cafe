"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2, Users } from "lucide-react";

import AdminRegisterPage from "@/app/auth/register/page";
import PageShell, { PageHeader } from "@/components/ui/PageShell";
import DataTable, { RowActions } from "@/components/ui/DataTable";
import Pagination from "@/components/ui/Pagination";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import Button, { IconButton } from "@/components/ui/Button";
import { authHeader, getAuthToken } from "@/lib/cookies";
import { toList } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [fetching, setFetching] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // The page/page_size params were previously missing, so the pager rendered
  // controls that could never fetch a second page.
  const fetchAdmins = async () => {
    if (!getAuthToken()) return;
    setFetching(true);
    try {
      const res = await fetch(
        `${API_URL}/api/user/admins/?page=${page}&page_size=${rowsPerPage}`,
        { headers: authHeader() },
      );
      const data = await res.json();
      if (res.ok) {
        setAdmins(data.data?.results || []);
        setTotalCount(data.data?.count || 0);
      }
    } catch (err) {
      console.error("Fetch admins error:", err);
      toast.error("Failed to load users");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  useEffect(() => {
    if (!getAuthToken()) {
      toast.error("Please sign in again");
      return;
    }

    const load = async (path, setter, label) => {
      try {
        const res = await fetch(`${API_URL}${path}`, { headers: authHeader() });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.response || `Failed to load ${label}`);
        // These endpoints are paginated, so data.data is { results, count }.
        setter(toList(data.data));
      } catch (err) {
        console.error(err);
        toast.error(`Failed to load ${label}`);
      }
    };

    load("/api/restaurants/", setRestaurants, "restaurants");
    load("/api/branches/", setBranches, "branches");
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((a) =>
      [
        a.username,
        a.first_name,
        a.last_name,
        `${a.first_name} ${a.last_name}`,
        a.email,
        a.mobile_number,
        a.restaurant_name,
        a.branch_name,
      ].some((field) => field?.toLowerCase?.().includes(q)),
    );
  }, [admins, search]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/user/admins/${pendingDelete.reference_id}/`,
        { method: "DELETE", headers: authHeader() },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.response || "Delete failed");

      toast.success("User deleted");
      setAdmins((prev) =>
        prev.filter((a) => a.reference_id !== pendingDelete.reference_id),
      );
      setTotalCount((c) => Math.max(0, c - 1));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditAdmin(null);
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
      header: "User",
      render: (row) => {
        const fullName =
          `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
        return (
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-100 text-2xs font-bold text-brand-700">
              {(fullName || row.username || "?").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">
                {fullName || row.username}
              </p>
              <p className="truncate text-2xs text-ink-500">@{row.username}</p>
            </div>
          </div>
        );
      },
    },
    {
      header: "Contact",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate lowercase text-ink-700">{row.email || "—"}</p>
          <p className="text-2xs text-ink-500 tabular-nums">
            {row.mobile_number || "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Restaurant",
      render: (row) =>
        row.restaurant_name || <span className="text-ink-400">—</span>,
    },
    {
      header: "Branch",
      render: (row) =>
        row.branch_name || <span className="text-ink-400">—</span>,
    },
    {
      header: "Actions",
      width: "96px",
      align: "right",
      render: (row) => (
        <RowActions>
          <IconButton
            icon={Pencil}
            label={`Edit ${row.username}`}
            size="sm"
            onClick={() => {
              setEditAdmin(row);
              setShowForm(true);
            }}
            variant="ghost-brand"
          />
          <IconButton
            icon={Trash2}
            label={`Delete ${row.username}`}
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
        title="Users"
        subtitle="Staff accounts and which branch each one belongs to."
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users…"
        action={
          <Button
            icon={Plus}
            onClick={() => {
              setEditAdmin(null);
              setShowForm(true);
            }}
          >
            New user
          </Button>
        }
      />

      <DataTable
        data={visible}
        columns={columns}
        loading={fetching}
        searchQuery={search}
        onClearSearch={() => setSearch("")}
        emptyIcon={Users}
        emptyTitle="No users yet"
        emptyDescription="Create an account so your staff can sign in."
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
        title={editAdmin ? "Edit user" : "New user"}
        size="xl"
      >
        <AdminRegisterPage
          adminData={editAdmin}
          admins={admins}
          adminToken={getAuthToken()}
          restaurants={restaurants}
          branches={branches}
          refreshAdmins={fetchAdmins}
          closeModal={closeForm}
          onValidationError={() => {}}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        itemName={pendingDelete?.username}
        loading={deleting}
        title="Delete user"
      />
    </PageShell>
  );
}
