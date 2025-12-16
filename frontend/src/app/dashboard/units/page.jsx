"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import AdminHeader from "../AdminHeader";

export default function AdminMenuUnitPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [units, setUnits] = useState([]);
  const [unitName, setUnitName] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // ------------------------------
  // FETCH UNITS
  // ------------------------------
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

  // ------------------------------
  // ADD / UPDATE UNIT
  // ------------------------------
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

  // ------------------------------
  // EDIT UNIT
  // ------------------------------
  const handleEdit = (unit) => {
    console.log("Editing unit:", unit);
    setUnitName(unit.name);
    setEditId(unit.reference_id); // use reference_id from MongoDB
  };

  // ------------------------------
  // DELETE UNIT
  // ------------------------------
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
    <div className="min-h-screen">
       {/* Header */}
       <AdminHeader/>
      <div className="p-6">
        <h1 className="text-3xl font-bold text-amber-700 mb-6">Menu Units</h1>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow mb-6 max-w-md"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editId ? "Edit Unit" : "Add Unit"}
          </h2>

          <div className="mb-4">
            <label className="block mb-1 font-medium">Unit Name</label>
            <input
              type="text"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
          >
            {loading ? "Processing..." : editId ? "Update" : "Add"}
          </button>

          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setUnitName("");
              }}
              className="ml-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </form>

        {/* Table */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Unit List</h2>

          {units.length === 0 ? (
            <p>No units found</p>
          ) : (
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2">Name</th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>

              <tbody>
                {units.map((u) => (
                  <tr key={u.reference_id}>
                    <td className="border px-4 py-2">{u.name}</td>
                    <td className="border px-4 py-2 space-x-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u.reference_id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
