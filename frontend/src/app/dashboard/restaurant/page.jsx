"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { X } from "lucide-react";

import ToastProvider from "@/components/ToastProvider";
import "@/styles/customButtons.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

export default function RestaurantPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteRestaurant, setDeleteRestaurant] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    mobile_number: "",
  });

  /* ================= FETCH ================= */
  const fetchRestaurants = async () => {
    try {
      const token = getCookie("adminToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/restaurants/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setRestaurants(data.data || []);
    } catch {
      toast.error("Failed to fetch restaurants");
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  /* ================= SEARCH ================= */
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [restaurants, search]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.mobile_number) {
      return toast.error("All fields required");
    }

    setLoading(true);

    try {
      const token = getCookie("adminToken");
      const url = editId
        ? `${API_URL}/api/restaurants/${editId}/`
        : `${API_URL}/api/restaurants/`;
      const method = editId ? "PATCH" : "POST";

      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        mobile_number: form.mobile_number.trim(),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success(editId ? "Updated!" : "Created!");
      closeModal();
      fetchRestaurants();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= ACTIONS ================= */
  const handleEdit = (r) => {
    setEditId(r.reference_id);
    setForm({
      name: r.name,
      address: r.address,
      mobile_number: r.mobile_number,
    });
    setShowForm(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const token = getCookie("adminToken");
      const res = await fetch(
        `${API_URL}/api/restaurants/${deleteRestaurant.reference_id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Token ${token}` },
        }
      );

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Deleted!");
      fetchRestaurants(); 
    } catch (err) {
      toast.error(err.message);
    } finally {
      setShowDeleteModal(false);
      setDeleteRestaurant(null);
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ name: "", address: "", mobile_number: "" });
  };

  return (
    <>
    <div className="mx-auto min-h-screen font-sans p-4 bg-[#ddf4e2] ">
      <ToastProvider />

      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 mb-2">
        <h1 className="self-start text-left text-[15px] font-bold text-[#236B28]">
          Restaurant
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
              placeholder="Search Restaurant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-[#236B28]/30 rounded-md pl-8 pr-3 py-1 text-[12px] 
        focus:outline-none focus:ring-1 focus:ring-[#236B28]/40 w-full md:w-[300px]"
            />
          </div>

          <button
            onClick={() => {
              setShowForm(true);
            }}
            className="flex items-center gap-1 px-4 py-1.5 text-[12px] font-semibold 
      bg-[#236B28] text-white rounded-md shadow-sm hover:bg-[#1C5721] transition"
          >
           
            Create
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-md w-[90%] max-w-sm p-4">
            <h2 className="text-lg font-bold text-red-600 mb-3">
              Confirm Delete
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteRestaurant?.name}</span>?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FORM MODAL ================= */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-4">
          <div className="bg-white w-full max-w-[480px] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 bg-white">
              <h2 className="text-[14px] font-bold text-[#236B28] tracking-tight">
                {editId ? "Edit Restaurant" : "Add New Restaurant"}
              </h2>
              <button
                onClick={closeModal}
                className="text-red-500 hover:text-red-600 transition-colors p-1 rounded hover:bg-gray-100"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-4 bg-[#ddf4e2]/20">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 bg-white p-4 rounded-md border border-gray-300 shadow-sm">

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-gray-600">
                      Restaurant Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter restaurant name"
                      className="w-full border border-gray-300 px-3 py-1.5 rounded text-[12px] outline-none focus:border-[#236B28] focus:ring-[2px] focus:ring-[#236B28]/10 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-gray-600">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Location details"
                      className="w-full border border-gray-300 px-3 py-1.5 rounded text-[12px] outline-none focus:border-[#236B28] focus:ring-[2px] focus:ring-[#236B28]/10 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-gray-600">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.mobile_number}
                      maxLength={10}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          mobile_number: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      placeholder="98XXXXXXXX"
                      className="w-full border border-gray-300 px-3 py-1.5 rounded text-[12px] outline-none focus:border-[#236B28] focus:ring-[2px] focus:ring-[#236B28]/10 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">

                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-1.5 bg-[#236B28] text-white rounded text-[12px] font-semibold shadow-sm transition-all hover:bg-[#1C5721] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? "Saving..." : editId ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ maxHeight: 'calc(100vh - 150px)' }}>
          <table className="min-w-full border-separate border-spacing-0 table-fixed text-[11px]">
            <thead className="sticky top-0 bg-[#fafafa] z-10">
              <tr>
                <th className="w-[40px] border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700">S.N.</th>
                <th className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700">Name</th>
                <th className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700">Address</th>
                <th className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700">Phone</th>
                <th className="w-[80px] border-b border-gray-300 px-2 py-1 text-right font-bold text-gray-700">Action</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody className="bg-white">
              {filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400 border-b border-gray-300">
                    {search ? "Restaurant not matching your search" : "No restaurants found"}
                  </td>
                </tr>
              ) : (
                filteredRestaurants.map((r, index) => (
                  <tr key={r.reference_id} className="hover:bg-blue-50/30 transition-all">

                    <td className="border-b border-r border-gray-300 px-2 py-0.5 text-gray-600 text-center">
                      {index + 1}
                    </td>

                    <td className="border-b border-r border-gray-300 px-1 py-0.5">
                      <div className=" px-1 py-0.5  text-gray-800 truncate font-medium">
                        {r.name}
                      </div>
                    </td>

                    <td className="border-b border-r border-gray-300 px-2 py-0.5 text-gray-500">
                      {r.address}
                    </td>

                    <td className="border-b border-r border-gray-300 px-2 py-0.5 text-gray-500">
                      {r.mobile_number}
                    </td>

                    <td className="border-b border-gray-300 px-2 py-0.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(r)}
                          className="p-1 text-blue-500 hover:scale-110 transition"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteRestaurant(r);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-red-500 hover:scale-110 transition"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
}
