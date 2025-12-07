"use client";
import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TableManager() {
  const [tables, setTables] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    table_name: "",
    capacity: "",
    location: "",
    qr_code: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch all tables
  const fetchTables = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      // const companyId = localStorage.getItem("companyId");

      if (!token) {
        toast.error("Please login as admin/staff first!");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/tables/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
          // "Company": companyId || "",
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to fetch tables: ${errText}`);
      }

      const data = await res.json();
      setTables(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch tables from server.");
      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Generate QR code
  const generateQR = async (tableName) => {
    const url = `${API_URL}/table/${encodeURIComponent(
      tableName.trim().replace(/\s+/g, "-")
    )}`;
    try {
      const qr = await QRCode.toDataURL(url);
      return qr;
    } catch (err) {
      console.error("QR generation error:", err);
      return "";
    }
  };

  // Add new table
  const handleAddTable = async () => {
    if (!formData.table_name || !formData.capacity) {
      toast.error("Please fill all required fields!");
      return;
    }

    const token = localStorage.getItem("adminToken");
    // const companyId = localStorage.getItem("companyId");

    if (!token) {
      toast.error("Please login as admin/staff first!");
      return;
    }

    const qr = await generateQR(formData.table_name);
    const newTable = { ...formData, qr_code: qr };

    try {
      const res = await fetch(`${API_URL}/api/tables/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
          // "Company": companyId || "",
        },
        body: JSON.stringify(newTable),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to add table: ${errText}`);
      }

      toast.success("Table added successfully!");
      setFormData({ id: null, table_name: "", capacity: "", location: "", qr_code: "" });
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to add table");
    }
  };

  // Edit table
  const handleEdit = (table) => {
    setIsEditing(true);
    setFormData(table);
  };

  // Update table
  const handleUpdateTable = async () => {
    const token = localStorage.getItem("adminToken");
    // const companyId = localStorage.getItem("companyId");

    if (!token) {
      toast.error("Please login as admin/staff first!");
      return;
    }

    const qr = await generateQR(formData.table_name);
    const updatedTable = { ...formData, qr_code: qr };

    try {
      const res = await fetch(`${API_URL}/api/tables/${formData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
          // "Company": companyId || "",
        },
        body: JSON.stringify(updatedTable),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to update table: ${errText}`);
      }

      toast.success("Table updated successfully!");
      setFormData({ id: null, table_name: "", capacity: "", location: "", qr_code: "" });
      setIsEditing(false);
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update table");
    }
  };

  // Delete table
  const handleDelete = async (id) => {
    const token = localStorage.getItem("adminToken");
    // const companyId = localStorage.getItem("companyId");

    if (!token) {
      toast.error("Please login as admin/staff first!");
      return;
    }

    if (!confirm("Are you sure you want to delete this table?")) return;

    try {
      const res = await fetch(`${API_URL}/api/tables/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Token ${token}`,
          // "Company": companyId || "",
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to delete table: ${errText}`);
      }

      toast.success("Table deleted successfully!");
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to delete table");
    }
  };

  if (loading) return <p className="p-5 text-xl">Loading tables...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-amber-800">Table Management</h1>

      {/* Form */}
      <div className="bg-gray-50 p-2 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">{isEditing ? "Edit Table" : "Add Table"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="text" name="table_name" placeholder="Table Name" value={formData.table_name} onChange={handleChange} className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <input type="number" name="capacity" placeholder="Capacity" value={formData.capacity} onChange={handleChange} className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <input type="text" name="location" placeholder="Location (optional)" value={formData.location} onChange={handleChange} className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-amber-500" />
        </div>
        <button onClick={isEditing ? handleUpdateTable : handleAddTable} className="mt-4 px-3 py-2 bg-amber-500 font-bold text-black hover:bg-amber-600 cursor-pointer rounded">
          {isEditing ? "Update Table" : "Add Table"}
        </button>
      </div>

      {/* Table List */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">All Tables</h2>
        {tables.length === 0 && <p>No tables available.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tables.map((table) => (
            <div key={table.id} className="border p-4 rounded shadow-sm bg-gray-50">
              <h3 className="text-lg font-bold">{table.table_name}</h3>
              <p>Capacity: {table.capacity}</p>
              <p>Location: {table.location || "Not set"}</p>
              {table.qr_code && <img src={table.qr_code} alt="QR Code" className="w-32 h-32 mt-3 border" />}
              <div className="flex gap-3 mt-3">
                <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={() => handleEdit(table)}>Edit</button>
                <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={() => handleDelete(table.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
