"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

import AdminRegisterPage from "@/app/auth/register/page";
import AdminHeader from "@/components/AdminHeader";
import ToastProvider from "@/components/ToastProvider";
import "@/styles/customButtons.css"

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [adminToken, setAdminToken] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);

  // Open edit modal
  const openEditModal = (admin) => {
    setEditAdmin(admin);
    setShowEditModal(true);
  };

  // Initial fetch
  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      toast.error("Admin token missing. Please login!");
      return;
    }

    setAdminToken(token);
    fetchAdmins(token);
    fetchRestaurants(token);
    fetchBranches(token);
  }, []);

  // Fetch admins
  const fetchAdmins = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/user/admins/`, {
        headers: { Authorization: `Token ${token}` },
      });

      console.log("Raw Response:", res);
      const data = await res.json();

    
      
      if (!res.ok) throw new Error(data.response || "Failed to fetch admins");

      // Always ensure array
      console.log("Admins:", data.data);

      setAdmins(data.data || []);
    } catch (err) {
      console.error("Fetch admins error:", err);
      toast.error("Failed to fetch admins");
    }
  };

  // Fetch restaurants
  const fetchRestaurants = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.response || "Failed to fetch restaurants");
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
  const handleDelete = async (reference_id) => {
    if (!reference_id) {
      console.log("Reference ID missing:", reference_id);
      return toast.error("Admin reference_id missing!");
    }
    if (!confirm("Are you sure you want to delete this admin?")) return;

    try {
      const res = await fetch(`${API_URL}/api/user/admins/${reference_id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${adminToken}` },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.response || "Delete failed");

      toast.success("Admin deleted successfully!");
      setAdmins((prev) => prev.filter((admin) => admin.reference_id !== reference_id));
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error(err.message);
    }
  };

  return (
    <div className="font-robot min-h-screen font-sans">
      <AdminHeader />
      <ToastProvider />

      <div className="px-4 sm:px-6 md:px-10 py-3">
        <div className="flex flex-row items-center justify-between flex-wrap gap-2">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600 truncate">
            Admin Management
          </h1>

          <button
            onClick={() => setShowForm(true)}
            className="button flex items-center gap-2 bg-amber-500 font-bold text-black px-5 py-2 rounded-xl shadow-lg transition duration-300 cursor-pointer"
          >
            Register
          </button>
        </div>

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
            <div className="rounded-3xl w-full max-w-3xl relative animate-fadeIn">
              <AdminRegisterPage
                adminData={editAdmin}
                admins={admins} 
                adminToken={adminToken}
                restaurants={restaurants}
                branches={branches}
                refreshAdmins={() => fetchAdmins(adminToken)}
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

      {/* Admin Table */}
      <div className="px-4 sm:px-6 md:px-10 p-4">
        <div className="overflow-x-auto rounded border border-amber-200 bg-white shadow">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-amber-50 uppercase">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-left">Username</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Name</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Email</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Mobile</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Address</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Restaurant</th>
                <th className="border border-gray-300 px-4 py-3 text-left">Branch</th>
                <th className="border border-gray-300 px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.length > 0 ? (
                admins.map((admin, index) => (
                  <tr
                    key={`${admin.reference_id ?? index}-${admin.email}`}
                    className="border-b hover:bg-amber-50 transition"
                  >
                    <td className="px-4 py-2 border">{admin.username}</td>
                    <td className="px-4 py-2 border">{admin.first_name} {admin.last_name}</td>
                    <td className="px-4 py-2 border">{admin.email}</td>
                    <td className="px-4 py-2 border">{admin.mobile_number}</td>
                    <td className="px-4 py-2 border">{admin.address}</td>
                    <td className="px-4 py-2 border">
                      {restaurants.find((r) => r.reference_id === admin.restaurant)?.name || "-"}
                    </td>
                    <td className="px-4 py-2 border">
                      {branches.find((b) => b.reference_id === admin.branch)?.name || "-"}
                    </td>
                    <td className="border px-4 py-2">
                      <div className="flex justify-center gap-4">
                        <button
                          title="Edit"
                          onClick={() => openEditModal(admin)}
                          className="text-amber-600 hover:underline"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(admin.reference_id)}
                          className="text-red-600 hover:bg-red-100 p-2 rounded transition"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-admins">
                  <td colSpan={8} className="px-4 py-6 border text-center text-gray-500">
                    No admins found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
