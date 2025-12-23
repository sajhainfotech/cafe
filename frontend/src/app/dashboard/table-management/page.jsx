"use client";

import React, { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import ToastProvider from "@/components/ToastProvider";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { X } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import "@/styles/customButtons.css"

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const FRONTEND_URL = process.env.NEXT_PUBLIC_CLIENT_URL;

export default function TableManager() {
  const formRef = useRef(null);
  const [tables, setTables] = useState([]);
  const [tableName, setTableName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openQr, setOpenQr] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // ---------------- Fetch Tables ----------------
  const fetchTables = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return toast.error("Login first!");
      const res = await fetch(`${API_URL}/api/tables/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      if (!res.ok || data.response_code !== "0") {
        throw new Error(data.response || "Failed to fetch tables");
      }

      const tablesWithQR = await Promise.all(
        (data.data || []).map(async (t) => {
          let token = t.token;
          if (!token && t.qr_code_url) {
            token = new URL(t.qr_code_url).searchParams.get("token");
          }
          const qrUrl = token ? `${FRONTEND_URL}/menu?token=${token}` : null;
          let qrBase64 = null;
          if (qrUrl) qrBase64 = await QRCode.toDataURL(qrUrl);
          return { ...t, qr_code: qrBase64, token_number: token };
        })
      );

      setTables(tablesWithQR);
    } catch (err) {
      toast.error(err.message || "Failed to load tables");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  // ---------------- Reset Form ----------------
  const resetForm = () => {
    setTableName("");
    setCapacity("");
    setLocation("");
    setEditId(null);
  };

  // ---------------- Submit Table ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tableName || !capacity) return toast.error("Table number and capacity required");

    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Login required");

      const tableToken = editId
        ? tables.find((t) => t.reference_id === editId)?.token_number
        : Date.now().toString();

      const qr = tableToken ? await QRCode.toDataURL(`${FRONTEND_URL}/menu?token=${tableToken}`) : "";

      const formData = new FormData();
      formData.append("table_number", tableName);
      formData.append("capacity", capacity);
      if (location) formData.append("location", location);
      formData.append("qr_code", qr);
      formData.append("token", tableToken);
      if (editId) formData.append("table_id", editId);

      const url = editId ? `${API_URL}/api/tables/${editId}/` : `${API_URL}/api/tables/`;
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, { method, headers: { Authorization: `Token ${token}` }, body: formData });
      const data = await res.json();
      if (!res.ok || data.response_code !== "0") throw new Error(data.response || "Failed to save table");

      toast.success(editId ? "Table updated!" : "Table added!");
      resetForm();
      setShowForm(false);
      fetchTables();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save table");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Edit Table ----------------
  const handleEdit = (t) => {
    setEditId(t.reference_id);
    setTableName(t.table_number);
    setCapacity(t.capacity || "");
    setLocation(t.location || "");
    setShowForm(true);
    if (formRef.current) formRef.current.scrollIntoView({ behavior: "smooth" });
  };

  // ---------------- Delete Table ----------------
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this table?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/api/tables/${id}/`, { method: "DELETE", headers: { Authorization: `Token ${token}` } });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Table deleted!");
      fetchTables();
    } catch (err) {
      toast.error("Delete failed");
      console.error(err);
    }
  };

  return (
    <div className="container min-h-screen font-sans">
      <ToastProvider />
      <AdminHeader />

      {/* Header */}
      {!showForm && (
        <div className="flex flex-row items-center justify-between px-4 sm:px-6 md:px-10 py-3 gap-4">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600">Tables Management</h1>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="button flex items-center justify-center gap-2 bg-amber-600 text-black px-5 py-2 rounded-xl font-bold shadow-lg transition duration-300 cursor-pointer"
          >
            + Create
          </button>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <div ref={formRef} className="bg-white shadow-lg shadow-amber-100 rounded-xl p-6 m-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-amber-600">{editId ? "Edit Table" : "Add Table"}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-600 hover:text-red-600">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Table Number"
              className="w-full border border-amber-300 p-3 rounded-lg focus:ring-2 focus:ring-amber-400"
              required
            />
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Capacity"
              className="w-full border border-amber-300 p-3 rounded-lg focus:ring-2 focus:ring-amber-400"
              required
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location (optional)"
              className="w-full border border-amber-300 p-3 rounded-lg focus:ring-2 focus:ring-amber-400"
            />

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-amber-500 hover:bg-amber-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button type="submit" disabled={loading} className="custom-btn w-full sm:w-auto cursor-pointer">
                {loading ? "Saving..." : editId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLE */}
      <div className="p-3">
        <div className="overflow-x-auto rounded border border-amber-200">
          <table className="min-w-full divide-y divide-amber-200">
            <thead className="bg-amber-50 uppercase text-sm">
              <tr>
                {["Table", "Capacity", "Location", "QR", "Actions"].map((h) => (
                  <th key={h} className="border border-gray-300 px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-amber-200 text-sm">
              {tables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-400">No tables found</td>
                </tr>
              ) : (
                tables.map((t) => (
                  <tr key={t.reference_id} className="border-b hover:bg-amber-50 transition">
                    <td className="border px-4 py-2">Table {t.table_number}</td>
                    <td className="border px-4 py-2">{t.capacity || "-"}</td>
                    <td className="border px-4 py-2">{t.location || "-"}</td>
                    <td className="border px-4 py-2">
                      {t.qr_code ? (
                        <img
                        
                          src={t.qr_code}
                          onClick={() => setOpenQr(t.qr_code)}
                          alt="QR Code"
                          className="w-10 h-10 object-contain cursor-pointer"
                        />
                      ) : <span className="text-gray-400">No QR</span>}
                    </td>
                    <td className="px-4 py-2 flex justify-center gap-3">
                      <button onClick={() => handleEdit(t)} className="text-amber-600 hover:bg-amber-100 p-2 rounded">
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDelete(t.reference_id)} className="text-red-600 hover:bg-red-100 p-2 rounded">
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

      {openQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpenQr(null)}>
          <div className="bg-white p-4 rounded-lg max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <img src={openQr} alt="QR Preview" className="w-full h-auto object-contain" />
            <button onClick={() => setOpenQr(null)} className="mt-4 w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-900 cursor-pointer">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
