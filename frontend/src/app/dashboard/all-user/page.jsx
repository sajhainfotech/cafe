"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

import AdminRegisterPage from "@/app/auth/register/page";

import ToastProvider from "@/components/ToastProvider";
import "@/styles/customButtons.css";
import HeaderWithSearch from "@/components/HeaderWithSearch";
import DeleteModal from "@/components/DeleteModal";
import CustomTable from "@/components/CustomTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [adminToken, setAdminToken] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteAdmin, setDeleteAdmin] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Open edit modal
  const openEditModal = (admin) => {
    setEditAdmin(admin);
    setShowEditModal(true);
  };

  // Initial fetch
  useEffect(() => {
    const token = getCookie("adminToken");

    if (!token) {
      toast.error("Admin token missing. Please login!");
      return;
    }

    setAdminToken(token);
    fetchAdmins(token);
    fetchRestaurants(token);
    fetchBranches(token);
  }, []);

  const fetchAdmins = async (token) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/user/admins/`, {
        headers: { Authorization: `Token ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setAdmins(data.data || []);
      } else {
        console.error("Server Error:", data);
      }
    } catch (err) {
      console.error("Fetch admins error:", err);
    }
  };

  // Fetch restaurants
  const fetchRestaurants = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.response || "Failed to fetch restaurants");
      setRestaurants(data.data || []);
    } catch (err) {
      console.error("Fetch restaurants error:", err);
      toast.error("Failed to fetch restaurants");
    }
  };

  // Fetch branches
  const fetchBranches = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/branches/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.response || "Failed to fetch branches");
      setBranches(data.data || []);
    } catch (err) {
      console.error("Fetch branches error:", err);
      toast.error("Failed to fetch branches");
    }
  };

  // Filter User
  const filteredUser = useMemo(() => {
    const query = search.toLowerCase();
    return admins.filter((b) => {
      return (
        b.username?.toLowerCase().includes(query) ||
        b.first_name?.toLowerCase().includes(query) ||
        b.last_name?.toLowerCase().includes(query) ||
        `${b.first_name} ${b.last_name}`.toLowerCase().includes(query) ||
        b.email?.toLowerCase().includes(query) ||
        b.mobile_number?.toLowerCase().includes(query) ||
        b.restaurant_name?.toLowerCase().includes(query) ||
        b.branch_name?.toLowerCase().includes(query)
      );
    });
  }, [admins, search]);

  // Delete admin
  const handleDeleteConfirmed = async () => {
    if (!deleteAdmin) return;

    try {
      const res = await fetch(
        `${API_URL}/api/user/admins/${deleteAdmin.reference_id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Token ${adminToken}` },
        },
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.response || "Delete failed");

      toast.success("Admin deleted successfully!");
      setAdmins((prev) =>
        prev.filter((admin) => admin.reference_id !== deleteAdmin.reference_id),
      );
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error(err.message);
    } finally {
      setShowDeleteModal(false);
      setDeleteAdmin(null);
    }
  };

  const userColumns = [
    {
      header: "S.N.",
      width: "40px",
      render: (_, index) => index + 1,
    },
    {
      header: "Username",
      render: (row) => row.username,
    },
    {
      header: "Name",
      render: (row) => `${row.first_name} ${row.last_name}`,
    },
    {
      header: "Email",
      render: (row) => row.email,
    },
    {
      header: "Phone",
      render: (row) => row.mobile_number,
    },
    {
      header: "Restaurent",
      render: (row) => row.restaurant_name,
    },
    {
      header: "Branch",
      render: (row) => row.branch_name,
    },

    {
      header: "Action",
      width: "80px",
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => openEditModal(row)}
            className="text-blue-500 hover:scale-110 transition cursor-pointer"
          >
            <PencilIcon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setDeleteAdmin(row);
              setShowDeleteModal(true);
            }}
            className="text-red-500 hover:scale-110 transition cursor-pointer"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];
  return (
    <>
      <div className="mx-auto min-h-screen font-sans p-4 bg-[#ddf4e2] ">
        <ToastProvider />

        <div className="px-2 sm:px-3 md:px-0 ">
          <HeaderWithSearch
            title="All User"
            searchValue={search}
            onSearchChange={setSearch}
            onButtonClick={() => {
              setShowForm(true);
            }}
            buttonLabel="Create"
            placeholder="Search User..."
          />

          {showDeleteModal && (
            <DeleteModal
              branch={deleteAdmin?.username}
              setShowDeleteModal={() => {
                setShowDeleteModal(false);
              }}
              handleDeleteConfirmed={handleDeleteConfirmed}
            />
          )}

          {(showForm || showEditModal) && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowForm(false);
                  setShowEditModal(false);
                  setEditAdmin(null);
                }
              }}
            >
              <div className="rounded w-full max-w-2xl p-3  relative animate-fadeIn">
                <AdminRegisterPage
                  adminData={editAdmin}
                  admins={admins}
                  adminToken={adminToken}
                  restaurants={restaurants}
                  branches={branches}
                  refreshAdmins={fetchAdmins}
                  closeModal={() => {
                    setShowForm(false);
                    setShowEditModal(false);
                    setEditAdmin(null);
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <CustomTable
          data={filteredUser}
          columns={userColumns}
          emptyMessage="No user found"
          searchQuery={search}
        />
      </div>
    </>
  );
}
