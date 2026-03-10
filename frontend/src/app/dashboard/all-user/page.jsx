"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

import AdminRegisterPage from "@/app/auth/register/page";

import ToastProvider from "@/components/ToastProvider";
import "@/styles/customButtons.css";
import HeaderWithSearch from "@/components/HeaderWithSearch";

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

  return (
    <>
      <div className="mx-auto min-h-screen font-sans p-4 bg-[#ddf4e2] ">
        <ToastProvider />

        <div className="px-2 sm:px-3 md:px-0 ">
          {/* <div className="flex flex-col md:flex-row items-center justify-between gap-2 mb-2">
            <h1 className="self-start text-left text-[15px] font-bold text-[#236B28]">
              All User
            </h1>

            <div className="flex w-full md:w-auto items-center gap-2">
              <div className="relative">
                <svg
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#236B28]/60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                  />
                </svg>

                <input
                  type="text"
                  placeholder="Search User..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border border-[#236B28]/30 rounded-md pl-8 pr-3 py-1 text-[12px] 
        focus:outline-none focus:ring-1 focus:ring-[#236B28]/40"
                />
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1 px-4 py-1.5 text-[12px] font-semibold 
      bg-[#236B28] text-white rounded-md shadow-sm hover:bg-[#1C5721] transition"
              >
                Create
              </button>
            </div>
          </div> */}

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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-lg shadow-md w-[90%] max-w-sm p-4">
                <h2 className="text-lg font-bold text-red-600 mb-3">
                  Confirm Delete
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">{deleteAdmin?.username}</span>
                  ?
                </p>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirmed}
                    className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-sm cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
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

        <div className="flex-1 min-h-0 bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden flex flex-col">
          <div
            className="flex-1 overflow-y-auto scrollbar-hide"
            style={{ maxHeight: "calc(100vh - 150px)" }}
          >
            <table className="min-w-full border-separate border-spacing-0 table-fixed text-[11px]">
              <thead className="sticky top-0 bg-[#fafafa] z-10">
                <tr>
                  <th className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700 w-10">
                    S.N.
                  </th>
                  <th className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700">
                    Username
                  </th>
                  <th className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700">
                    Name
                  </th>
                  <th className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700">
                    Email
                  </th>
                  <th className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700">
                    Mobile
                  </th>
                  <th className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700">
                    Restaurant
                  </th>
                  <th className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700">
                    Branch
                  </th>
                  <th className="border-b border-gray-300 px-2 py-1 text-right font-bold text-gray-700 w-20">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {admins.filter((admin) => {
                  if (!search) return true;
                  const branchName = branches
                    .find(
                      (b) =>
                        b.reference_id === admin.branch ||
                        b.id === admin.branch ||
                        b._id === admin.branch,
                    )
                    ?.name?.toLowerCase();
                  return (
                    admin.username
                      .toLowerCase()
                      .includes(search.toLowerCase()) ||
                    admin.first_name
                      .toLowerCase()
                      .includes(search.toLowerCase()) ||
                    admin.last_name
                      .toLowerCase()
                      .includes(search.toLowerCase()) ||
                    admin.email.toLowerCase().includes(search.toLowerCase()) ||
                    admin.mobile_number
                      .toLowerCase()
                      .includes(search.toLowerCase()) ||
                    admin.address
                      .toLowerCase()
                      .includes(search.toLowerCase()) ||
                    (branchName && branchName.includes(search.toLowerCase()))
                  );
                }).length > 0 ? (
                  admins
                    .filter((admin) => {
                      if (!search) return true;
                      const branchName = branches
                        .find(
                          (b) =>
                            b.reference_id === admin.branch ||
                            b.id === admin.branch ||
                            b._id === admin.branch,
                        )
                        ?.name?.toLowerCase();
                      return (
                        admin.username
                          .toLowerCase()
                          .includes(search.toLowerCase()) ||
                        admin.first_name
                          .toLowerCase()
                          .includes(search.toLowerCase()) ||
                        admin.last_name
                          .toLowerCase()
                          .includes(search.toLowerCase()) ||
                        admin.email
                          .toLowerCase()
                          .includes(search.toLowerCase()) ||
                        admin.mobile_number
                          .toLowerCase()
                          .includes(search.toLowerCase()) ||
                        admin.address
                          .toLowerCase()
                          .includes(search.toLowerCase()) ||
                        (branchName &&
                          branchName.includes(search.toLowerCase()))
                      );
                    })
                    .map((admin, index) => (
                      <tr
                        key={admin.reference_id || index}
                        className="hover:bg-blue-50/30 transition-all"
                      >
                        <td className="border-b border-r border-gray-300 px-2 py-0.5 text-gray-600">
                          {index + 1}
                        </td>

                        <td className="border-b border-r border-gray-300 px-1 py-0.5">
                          <div className="  px-1 py-0.5 text-gray-800 truncate">
                            {admin.username}
                          </div>
                        </td>

                        <td className="border-b border-r border-gray-300 px-2 py-0.5 text-gray-700">
                          {admin.first_name} {admin.last_name}
                        </td>

                        <td className="border-b border-r border-gray-300 px-2 py-0.5 text-gray-500 truncate">
                          {admin.email}
                        </td>

                        <td className="border-b border-r border-gray-300 px-2 py-0.5 text-gray-500">
                          {admin.mobile_number}
                        </td>

                        <td className="border-b border-r border-gray-300 px-2 py-0.5">
                          <span className="text-[10px] px-1.5 py-0   bg-white text-gray-800 truncate block">
                            {admin.restaurant_name || "-"}
                          </span>
                        </td>

                        <td className="border-b border-r border-gray-300 px-2 py-0.5 text-gray-500 italic">
                          {admin.branch_name || "-"}
                        </td>

                        <td className="border-b border-gray-300 px-2 py-0.5 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(admin)}
                              className="text-blue-500 hover:scale-110 transition cursor-pointer"
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteAdmin(admin);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-500 hover:scale-110 transition cursor-pointer"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-400 border-b border-gray-300"
                    >
                      User not found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
