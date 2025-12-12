"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TableManager() {
  const [branches, setBranches] = useState([]);
  const [tables, setTables] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    table_name: "",
    capacity: "",
    location: "",
    qr_code: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // LocalStorage states
  const [selectedBranch, setSelectedBranch] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [token, setToken] = useState("");

  // Load localStorage values
  useEffect(() => {
    setSelectedBranch(localStorage.getItem("branchId") || "");
    setRestaurantId(localStorage.getItem("restaurantId") || "");
    setToken(localStorage.getItem("adminToken") || "");
  }, []);

  // Fetch branches
  const fetchBranches = async () => {
    if (!token) return toast.error("Please login first!");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/branches/`, {
        headers: { Authorization: `Token ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error("Failed to fetch branches");

      setBranches(data.data || []);

      // Set default branch if missing
      if (!selectedBranch && data.data.length > 0) {
        const defaultBranch = data.data[0].branch_reference_id;
        setSelectedBranch(defaultBranch);
        localStorage.setItem("branchId", defaultBranch);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tables
  const fetchTables = async (branchId = selectedBranch) => {
    if (!branchId || !token) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/tables/?branch=${branchId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        }
      );

      const data = await res.json();
      setTables(data.data || []);
    } catch (err) {
      toast.error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBranches();
  }, [token]);

  useEffect(() => {
    if (selectedBranch) fetchTables(selectedBranch);
  }, [selectedBranch, token]);

  // Handle input change
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Generate QR Code
  const generateQR = async (tableName) => {
    const url = `${API_URL}/table/${encodeURIComponent(
      tableName.trim().replace(/\s+/g, "-")
    )}`;

    try {
      return await QRCode.toDataURL(url);
    } catch {
      return "";
    }
  };

  // Add Table
  const handleAddTable = async () => {
    if (!formData.table_name || !formData.capacity)
      return toast.error("Please fill required fields!");

    if (!selectedBranch || !restaurantId)
      return toast.error("Branch or restaurant missing!");

    const qr = await generateQR(formData.table_name);

    const newTable = {
      table_name: formData.table_name,
      capacity: formData.capacity,
      location: formData.location,
      qr_code: qr,
      branch: selectedBranch,     // branch_reference_id
      restaurant: restaurantId,   // restaurant_reference_id
    };

    try {
      const res = await fetch(`${API_URL}/api/tables/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(newTable),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.response || "Failed");

      toast.success("Table added successfully!");
      setFormData({ id: null, table_name: "", capacity: "", location: "", qr_code: "" });
      fetchTables(selectedBranch);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Edit Button
  const handleEdit = (table) => {
    setIsEditing(true);
    setFormData(table);
  };

  // Update Table
  const handleUpdateTable = async () => {
    const qr = await generateQR(formData.table_name);

    const updatedTable = {
      table_name: formData.table_name,
      capacity: formData.capacity,
      location: formData.location,
      qr_code: qr,
      branch: selectedBranch,
      restaurant: restaurantId,
    };

    try {
      const res = await fetch(`${API_URL}/api/tables/${formData.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(updatedTable),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.response || "Failed to update");

      toast.success("Table updated!");
      setIsEditing(false);
      setFormData({ id: null, table_name: "", capacity: "", location: "", qr_code: "" });
      fetchTables(selectedBranch);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Delete Table
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this table?")) return;

    try {
      const res = await fetch(`${API_URL}/api/tables/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Table deleted!");
      fetchTables(selectedBranch);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <p className="p-5 text-xl">Loading...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-amber-800">Table Management</h1>

      {/* Branch Select */}
      <div className="mb-4">
        <label className="font-semibold mr-2">Select Branch:</label>
        <select
          value={selectedBranch}
          onChange={(e) => {
            setSelectedBranch(e.target.value);
            localStorage.setItem("branchId", e.target.value);
          }}
          className="border p-2 rounded"
        >
          {branches.map((b) => (
            <option key={b.branch_reference_id} value={b.branch_reference_id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add/Edit Table */}
      <div className="bg-gray-50 p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">
          {isEditing ? "Edit Table" : "Add Table"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            name="table_name"
            placeholder="Table Name"
            value={formData.table_name}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="number"
            name="capacity"
            placeholder="Capacity"
            value={formData.capacity}
            onChange={handleChange}
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="location"
            placeholder="Location (optional)"
            value={formData.location}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>

        <button
          onClick={isEditing ? handleUpdateTable : handleAddTable}
          className="mt-4 px-4 py-2 bg-amber-500 font-bold text-black hover:bg-amber-600 rounded"
        >
          {isEditing ? "Update Table" : "Add Table"}
        </button>
      </div>

      {/* Table List */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">All Tables</h2>

        {tables.length === 0 ? (
          <p>No tables available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tables.map((table) => (
              <div key={table.id} className="border p-4 rounded bg-gray-50 shadow-sm">
                <h3 className="text-lg font-bold">{table.table_name}</h3>
                <p>Capacity: {table.capacity}</p>
                <p>Location: {table.location || "Not set"}</p>

                {table.qr_code && (
                  <img
                    src={table.qr_code}
                    alt="QR Code"
                    className="w-32 h-32 mt-3 border"
                  />
                )}

                <div className="flex gap-3 mt-3">
                  <button
                    className="px-3 py-1 bg-green-600 text-white rounded"
                    onClick={() => handleEdit(table)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 bg-red-600 text-white rounded"
                    onClick={() => handleDelete(table.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
