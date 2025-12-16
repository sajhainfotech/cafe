"use client";

import AdminHeader from "@/components/AdminHeader";
import ToastProvider from "@/components/ToastProvider";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function AdminMenuUnitPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [units, setUnits] = useState([]);
  const [unitName, setUnitName] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return toast.error("Login first!");

      const res = await fetch(`${API_URL}/api/units/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch units");

      const data = await res.json();
      console.log("Fetched units:", data.data);

      const items = Array.isArray(data.data) ? data.data : [];
      setUnits(items);
    } catch (err) {
      console.error("Fetch units error:", err);
      toast.error("Failed to load units");
      setUnits([]);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unitName.trim()) return toast.error("Unit name is required");

    setLoading(true);

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Login again!");

      const payload = { name: unitName.trim() };
      const url = editId
        ? `${API_URL}/api/units/${editId}/`
        : `${API_URL}/api/units/`;
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Save error response:", errorData);
        throw new Error("Request failed");
      }

      toast.success(editId ? "Unit updated!" : "Unit added!");
      setUnitName("");
      setEditId(null);
      fetchUnits();
    } catch (err) {
      console.error("Save unit error:", err);
      toast.error("Failed to save unit");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (unit) => {
    console.log("Editing unit:", unit);
    setUnitName(unit.name);
    setEditId(unit.reference_id);
  };

  const handleDelete = async (reference_id) => {
    console.log("Deleting unit ID:", reference_id);
    if (!reference_id) return toast.error("Invalid unit ID");
    if (!confirm("Are you sure you want to delete this unit?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Login again!");

      const res = await fetch(`${API_URL}/api/units/${reference_id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Delete error response:", errorData);
        throw new Error("Delete failed");
      }

      toast.success("Unit deleted!");
      fetchUnits();
    } catch (err) {
      console.error("Delete unit error:", err);
      toast.error("Failed to delete unit");
    }
  };

  return (
    <div className="font-robot">
      <AdminHeader />
      <div className="flex flex-row items-center justify-between flex-wrap px-4 sm:px-6 md:px-10 py-3 gap-2">
        {/* Heading */}
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 truncate">
          Menu Units
        </h1>

        {/* Button */}
        <button
          onClick={() => {
            setEditId(null);
            setUnitName("");
            setShowForm(true);
          }}
          className="flex-shrink-0 flex items-center font-bold justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl shadow-lg transition duration-300 cursor-pointer"
        >
          + Create 
        </button>
      </div>

      <div className="p-4 md:p-3 min-h-screen font-roboto">
        <ToastProvider />
        <div className="overflow-x-auto rounded border border-blue-200">
          <table className="min-w-full border-collapse">
            <thead className="bg-blue-50 uppercase text-sm">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  Unit Name
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {units.length === 0 ? (
                <tr>
                  <td colSpan="2" className="px-4 py-4 border">
                    No units found
                  </td>
                </tr>
              ) : (
                units.map((u) => (
                  <tr
                    key={u.reference_id}
                    className="border-b hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 border">{u.name}</td>

                    <td className="border px-4 py-2">
                      <div className="flex justify-center gap-8">
                        <button
                          onClick={() => handleEdit(u)}
                          className="text-blue-600 hover:bg-blue-100 p-2 rounded"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.reference_id)}
                          className="text-red-600 hover:bg-red-100 p-2 rounded"
                        >
                          <TrashIcon className="w-5 h-5" />
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

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            // Close only if clicked outside modal
            if (e.target === e.currentTarget) {
              setShowForm(false);
              setEditId(null);
              setUnitName("");
            }
          }}
        >
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg animate-fadeIn relative">
            {/* CLOSE BUTTON */}
            <button
              onClick={() => {
                setShowForm(false);
                setEditId(null);
                setUnitName("");
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
            >
              ✕
            </button>

            <h2 className="text-xl sm:text-2xl md:text-2xl font-bold mb-4 text-blue-700">
              {editId ? "Edit Unit" : "Create Unit"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Unit Name
                </label>
                <input
                  type="text"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  required
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditId(null);
                    setUnitName("");
                  }}
                  className="px-2 py-2 border border-red-500 rounded-lg font-medium hover:bg-red-100 w-full sm:w-auto text-sm sm:text-base cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow w-full sm:w-auto text-sm sm:text-base font-medium cursor-pointer"
                >
                  {loading ? "Processing..." : editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
