"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

import "@/styles/customButtons.css";
import ToastProvider from "@/components/ToastProvider";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { X } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminMenuUnitPage() {
  const formRef = useRef(null);
  const [units, setUnits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [unitName, setUnitName] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/units/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setUnits(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch units");
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

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || "Failed to save");

      toast.success(editId ? "Unit updated!" : "Unit added!");
      setUnitName("");
      setEditId(null);
      setShowForm(false);
      fetchUnits();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error saving unit");
    }
    setLoading(false);
  };

  const handleEdit = (unit) => {
    setEditId(unit.reference_id);
    setUnitName(unit.name);
    setShowForm(true);

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this unit?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/api/units/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Unit deleted!");
      fetchUnits();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Delete failed");
    }
  };

  return (
    <div className="container min-h-screen font-sans">
      <ToastProvider />
      <AdminHeader />

     
      {!showForm && (
        <div className="flex flex-row items-center justify-between px-4 sm:px-6 md:px-10 py-3 gap-4">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600">
            Units Management
          </h1>
          <button
            onClick={() => {
              setEditId(null);
              setUnitName("");
              setShowForm(true);
            }}
           className="button flex items-center justify-center gap-2 bg-amber-600 text-black px-5 py-2 rounded-xl font-bold shadow-lg transition duration-300 cursor-pointer"
          >
            + Create
          </button>
        </div>
      )}

      {showForm && (
        <div
          ref={formRef}
          className="bg-white shadow-lg shadow-amber-100 rounded-xl p-6 m-5"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-amber-600">
              {editId ? "Edit Unit" : "Add Unit"}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-600 hover:text-red-600"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="Unit Name"
              className="w-full border border-amber-300 p-3 rounded-lg focus:ring-2 focus:ring-amber-400"
              required
            />

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-amber-500 hover:bg-amber-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="custom-btn w-full sm:w-auto cursor-pointer"
              >
                {loading ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      
      <div className="p-3">
        <div className="overflow-x-auto rounded border border-amber-200">
          <table className="min-w-full divide-y divide-amber-200">
            <thead className="bg-amber-50 uppercase text-sm">
              <tr>
                {["Name", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="border border-gray-300 px-4 py-3 text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-amber-200 text-sm">
              {units.length === 0 ? (
                <tr>
                  <td colSpan={2} className="text-center py-6 text-gray-400">
                    No units found
                  </td>
                </tr>
              ) : (
                units.map((u) => (
                  <tr
                    key={u.reference_id}
                    className="border-b hover:bg-amber-50 transition"
                  >
                    <td className="border px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2 flex justify-center gap-3">
                      <button
                        onClick={() => handleEdit(u)}
                         className="text-amber-600 hover:bg-amber-100 p-2 rounded"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.reference_id)}
                        className="text-red-600 hover:bg-red-100 p-2 rounded"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
