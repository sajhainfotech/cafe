"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import ToastProvider from "@/components/ToastProvider";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import AdminHeader from "../AdminHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const FRONTEND_URL = process.env.NEXT_PUBLIC_CLIENT_NETWORK

export default function TableManager() {
  const [tables, setTables] = useState([]);
  const [tableName, setTableName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [message] = useState("");

  const fetchTables = async () => {
    console.log("Fetching tables...");
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        toast.error("Login first!");
        console.error("No admin token found!");
        return;
      }

      const res = await fetch(`${API_URL}/api/tables/`, {
        headers: { Authorization: `Token ${token}` },
      });
      console.log("GET /api/tables/ status:", res.status);

      const data = await res.json();
      console.log("GET /api/tables/ response:", data);

      if (!res.ok || data.response_code !== "0") {
        throw new Error(data.response || "Failed to fetch tables");
      }

      // Generate QR base64 for each table
      const tablesWithQR = await Promise.all(
        (data.data || []).map(async (t) => {
          if (t.qr_code_url) {
            try {
              const qrBase64 = await QRCode.toDataURL(t.qr_code_url);
              return { ...t, qr_code: qrBase64 };
            } catch (err) {
              console.error("QR generation error for table:", t, err);
              return t;
            }
          }
          return t;
        })
      );

      setTables(tablesWithQR);

    } catch (err) {
      toast.error(err.message || "Failed to load tables");
      console.error("Error fetching tables:", err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // const generateQRCode = async (token) => {
  //   try {
  //     const url = `https://restaurantsapi.sajhainfotech.com/scan?token=${token}&table_number=${tableName}`;

  //     console.log("Generating QR for:", url);
  //     const qrData = await QRCode.toDataURL(url);
  //     console.log("QR code generated:", qrData);
  //     return qrData;
  //   } catch (err) {
  //     console.error("QR generation error:", err);
  //     toast.error("Failed to generate QR");
  //     return "";
  //   }
  // };


  const generateQRCode = async (tableToken) => {
    try {
      const url = `${FRONTEND_URL}/menu?table_token=${tableToken}`;
      console.log("📎 QR URL:", url);

      const qrData = await QRCode.toDataURL(url);
      return qrData;
    } catch (err) {
      toast.error("QR generate failed");
      return "";
    }
  };



  const resetForm = () => {
    setTableName("");
    setCapacity("");
    setLocation("");
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tableName || !capacity) {
      toast.error("Table number and capacity required");
      return;
    }

    setLoading(true);
    console.log(editId ? "Updating table..." : "Adding new table...");

    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Login required");

      const tableToken = editId || Date.now();
      const qr = await generateQRCode(tableToken);

      const formData = new FormData();
      formData.append("table_number", tableName);
      formData.append("capacity", capacity);
      if (location) formData.append("location", location);
      formData.append("qr_code", qr);
      formData.append("token", tableToken);


      const url = editId
        ? `${API_URL}/api/tables/${editId}/`
        : `${API_URL}/api/tables/`;
      const method = editId ? "PATCH" : "POST";

      console.log(
        `${method} request to ${url} with FormData:`,
        Object.fromEntries(formData)
      );

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Token ${token}` },
        body: formData,
      });

      console.log(`${method} response status:`, res.status);
      const data = await res.json();
      console.log(`${method} response:`, data);

      if (!res.ok || data.response_code !== "0") {
        const msg = Object.values(data.errors || {})
          .flat()
          .join(" | ");
        throw new Error(msg || "Failed to save table");
      }

      toast.success(editId ? "Table updated!" : "Table added!");
      resetForm();
      fetchTables();
    } catch (err) {
      toast.error(err.message || "Failed to save table");
      console.error("Error in handleSubmit:", err);
    } finally {
      setLoading(false);
    }
  };


  //   const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!tableName || !capacity) {
  //     toast.error("Table number and capacity required");
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     const adminToken = localStorage.getItem("adminToken");
  //     if (!adminToken) throw new Error("Login required");

  //     // Table token (integer)
  //     const tableToken = editId ? parseInt(editId, 10) : Date.now();

  //     // Generate QR code
  //     const qr = await generateQRCode(tableToken);

  //     // FormData
  //     const formData = new FormData();
  //     formData.append("table_number", tableName);
  //     formData.append("capacity", parseInt(capacity, 10));
  //     formData.append("location", location || "");
  //     formData.append("token", tableToken); 
  //     formData.append("qr_code", qr); // base64 string

  //     const url = editId
  //       ? `${API_URL}/api/tables/${editId}/`
  //       : `${API_URL}/api/tables/`;
  //     const method = editId ? "PATCH" : "POST";

  //     const res = await fetch(url, {
  //       method,
  //       headers: {

  //       },
  //       body: formData,
  //     });

  //     const data = await res.json();
  //     if (!res.ok || data.response_code !== "0") {
  //       const msg = Object.values(data.errors || {}).flat().join(" | ");
  //       throw new Error(msg || "Failed to save table");
  //     }

  //     toast.success(editId ? "Table updated!" : "Table added!");
  //     resetForm();
  //     fetchTables();
  //   } catch (err) {
  //     toast.error(err.message || "Failed to save table");
  //     console.error("Error in handleSubmit:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleEdit = (t) => {
    console.log("Editing table:", t);
    setEditId(t.reference_id);
    setTableName(t.table_number);
    setCapacity(t.capacity || "");
    setLocation(t.location || "");
    setShowForm(true);

  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this table?")) return;
    console.log("Deleting table ID:", id);

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/api/tables/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });

      console.log("DELETE response status:", res.status);
      if (!res.ok) throw new Error("Delete failed");

      toast.success("Table deleted!");
      fetchTables();
    } catch (err) {
      toast.error("Delete failed");
      console.error("Error deleting table:", err);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <AdminHeader />

      <div className="p-6">
        <ToastProvider />
        <h1 className="text-3xl font-bold mb-6 text-amber-600">Tables</h1>
        {/* Add Table Button */}
        <button
          onClick={() => {
            setTableName("");
            setCapacity("");
            setLocation("");
            setEditId(null);
            setShowForm(true);
          }}
          className="mb-6 bg-amber-500 text-white px-5 py-2 rounded-lg shadow cursor-pointer"
        >
          + Add Table
        </button>

        {/* Table List */}
        <div className="overflow-x-auto shadow rounded-lg">
          <table className="min-w-full bg-white rounded-lg table-auto">
            <thead className="bg-amber-400 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm sm:text-base">
                  Table
                </th>
                <th className="px-4 py-3 text-left text-sm sm:text-base">
                  Capacity
                </th>
                <th className="px-4 py-3 text-left text-sm sm:text-base">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-sm sm:text-base">
                  QR Code
                </th>
                <th className="px-4 py-3 text-left text-sm sm:text-base">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t, i) => (
                <tr
                  key={t.reference_id || i}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-2 text-sm sm:text-base">
                    Table {t.table_number}
                  </td>
                  <td className="px-4 py-2 text-sm sm:text-base">
                    {t.capacity || "-"}
                  </td>
                  <td className="px-4 py-2 text-sm sm:text-base">
                    {t.location || "-"}
                  </td>
                  <td className="px-4 py-2">
                    {t.qr_code ? (
                      <a
                        href={t.qr_code}
                        download={`QR-${t.table_number || t.reference_id}`}
                        title="Download QR Code"
                      >
                        <img
                          src={t.qr_code}
                          alt="QR"
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded shadow-sm cursor-pointer hover:scale-105 transition-transform"
                        />
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm sm:text-base">
                        No QR
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 mt-7 flex gap-4 sm:gap-3">
                    <button
                      onClick={() => handleEdit(t)}
                      className="flex items-center gap-1 px-2 py-1 text-blue-500 transition hover:text-blue-600"
                    >
                      <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.reference_id)}
                      className="flex items-center gap-1 px-2 py-1 text-red-500 transition hover:text-red-600"
                    >
                      <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-opacity-30 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
              <h2 className="text-xl font-bold mb-4">
                {editId ? "Edit Table" : "Add Table"}
              </h2>
              {message && <p className="text-red-500 mb-2">{message}</p>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Table Name / Number"
                  required
                  className="w-full border p-2 rounded text-sm sm:text-base"
                />
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Capacity"
                  required
                  className="w-full border p-2 rounded text-sm sm:text-base"
                />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location (optional)"
                  className="w-full border p-2 rounded text-sm sm:text-base"
                />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border rounded text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 text-white rounded text-sm sm:text-base"
                  >
                    {loading ? "Saving..." : editId ? "Update" : "Add Table"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
