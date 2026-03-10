"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import ToastProvider from "@/components/ToastProvider";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Download, X } from "lucide-react";
import "@/styles/customButtons.css";
import HeaderWithSearch from "@/components/HeaderWithSearch";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const FRONTEND_URL = process.env.NEXT_PUBLIC_CLIENT_URL;

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

export default function TableManager() {
  const [tables, setTables] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [tableName, setTableName] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openQr, setOpenQr] = useState(null);
  const [deleteTable, setDeleteTable] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  // ---------------- Fetch Tables ----------------
  const fetchTables = async () => {
    try {
      const token = getCookie("adminToken");
      if (!token) return toast.error("Login first!");

      const res = await fetch(`${API_URL}/api/tables/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      if (!res.ok || data.response_code !== "0")
        throw new Error(data.response || "Failed to fetch tables");

      const tablesWithQR = await Promise.all(
        (data.data || []).map(async (t) => {
          let tokenNumber =
            t.token || new URL(t.qr_code_url || "").searchParams.get("token");
          const qrUrl = tokenNumber
            ? `${FRONTEND_URL}/menu?token=${tokenNumber}`
            : null;
          let qrBase64 = null;
          if (qrUrl) qrBase64 = await QRCode.toDataURL(qrUrl);
          return { ...t, qr_code: qrBase64, token_number: tokenNumber };
        }),
      );

      setTables(tablesWithQR);
    } catch (err) {
      toast.error(err.message || "Failed to load tables");
      console.error(err);
    }
  };

  const isFetched = useRef(false);
  useEffect(() => {
    if (!isFetched.current) {
      const loadInitialData = async () => {
        const token = getCookie("adminToken");
        if (token) {
          await Promise.all([fetchTables()]);
        }
      };
      loadInitialData();
      isFetched.current = true;
    }
  }, []);

  const filteredTables = tables.filter((t) =>
    t.table_number.toString().includes(search.trim()),
  );

  useEffect(() => {
    setSearchQuery(search);
  }, [search]);

  // ---------------- Form ----------------
  const resetForm = () => {
    setTableName("");

    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tableName) return toast.error("Table number required");
    setLoading(true);
    try {
      const token = getCookie("adminToken");
      if (!token) throw new Error("Login required");

      const tableToken = editId
        ? tables.find((t) => t.reference_id === editId)?.token_number
        : Date.now().toString();

      const qr = tableToken
        ? await QRCode.toDataURL(`${FRONTEND_URL}/menu?token=${tableToken}`)
        : "";

      const formData = new FormData();
      formData.append("table_number", tableName);

      formData.append("qr_code", qr);
      formData.append("token", tableToken);
      if (editId) formData.append("table_id", editId);

      const url = editId
        ? `${API_URL}/api/tables/${editId}/`
        : `${API_URL}/api/tables/`;
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Token ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || data.response_code !== "0")
        throw new Error(data.response || "Failed to save table");

      toast.success(editId ? "Table updated!" : "Table created!");
      resetForm();
      setShowForm(false);
      fetchTables();
    } catch (err) {
      toast.error(err.message || "Failed to save table");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t) => {
    setEditId(t.reference_id);
    setTableName(t.table_number);

    setShowForm(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTable) return;
    try {
      const token = getCookie("adminToken");
      const res = await fetch(
        `${API_URL}/api/tables/${deleteTable.reference_id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Token ${token}` },
        },
      );
      if (!res.ok) throw new Error("Delete failed");

      toast.success("Table deleted!");
      fetchTables();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setShowDeleteModal(false);
      setDeleteTable(null);
    }
  };

  return (
    <>
      <div className="mx-auto min-h-screen font-sans p-4 bg-[#ddf4e2]">
        <ToastProvider />

        {/* <div className="flex flex-col md:flex-row items-center justify-between gap-2 mb-2">
          <h1 className="self-start text-left text-[15px] font-bold text-[#236B28]">
            Table
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
                placeholder="Search Table..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-[#236B28]/30 rounded-md pl-8 pr-3 py-1 text-[12px] 
        focus:outline-none focus:ring-1 focus:ring-[#236B28]/40 w-full md:w-[300px]"
              />
            </div>

            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-1 px-4 py-1.5 text-[12px] font-semibold 
      bg-[#236B28] text-white rounded-md shadow-sm hover:bg-[#1C5721] transition"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create
            </button>
          </div>
        </div> */}
        <HeaderWithSearch
          title="Table"
          searchValue={search}
          onSearchChange={setSearch}
          buttonLabel="Create"
          onButtonClick={() => {
            resetForm();
            setShowForm(true);
          }}
          placeholder="Search Table..."
        />

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-md w-[90%] max-w-sm p-4">
              <h2 className="text-lg font-bold text-red-600 mb-3">
                Confirm Delete
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete table{" "}
                <span className="font-semibold">
                  {deleteTable?.table_number}
                </span>
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

        {/* FORM MODAL */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
            <div className="bg-white w-full max-w-[320px] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-[13px] font-bold text-gray-700">
                  {editId ? "Edit Table" : "Add New Table"}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-semibold text-gray-600">
                    Table Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="e.g. T-01"
                    className="w-full px-3 py-1.5 text-[12px] border border-gray-300 rounded focus:border-[#236B28] focus:ring-[2px] focus:ring-[#236B28]/10 outline-none transition-all placeholder:text-gray-400"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-1.5 text-[12px] font-semibold text-white rounded shadow-sm transition-all cursor-pointer
              ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#236B28] hover:bg-[#1C5721] active:scale-95"
              }`}
                  >
                    {loading ? "Saving..." : editId ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TABLE WRAPPER */}
        <div className="flex-1 min-h-0 bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden flex flex-col">
          <div
            className="flex-1 overflow-y-auto scrollbar-hide"
            style={{ maxHeight: "calc(100vh - 150px)" }}
          >
            <table className="min-w-full border-separate border-spacing-0 table-fixed text-[11px]">
              <thead className="sticky top-0 bg-[#fafafa] z-10">
                <tr>
                  <th className="w-[50px] border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700">
                    S.N.
                  </th>
                  <th className="border-b border-r border-gray-300 px-4 py-1 text-left font-bold text-gray-700">
                    Table Name
                  </th>
                  <th className="w-[100px] border-b border-r border-gray-300 px-4 py-1 text-left font-bold text-gray-700">
                    QR Code
                  </th>
                  <th className="w-[80px] border-b border-gray-300 px-2 py-1 text-right font-bold text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {filteredTables.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-8 text-gray-400 border-b border-gray-300"
                    >
                      {searchQuery
                        ? "No tables match your search"
                        : "No tables found"}
                    </td>
                  </tr>
                ) : (
                  filteredTables.map((t, index) => (
                    <tr
                      key={t.reference_id}
                      className="hover:bg-blue-50/30 transition-all"
                    >
                      <td className="border-b border-r border-gray-300 px-2 py-0.5 text-gray-500 text-center">
                        {index + 1}
                      </td>

                      <td className="border-b border-r border-gray-300 px-2 py-0.5">
                        <div className=" border-gray-300 rounded px-2 py-0.5  text-gray-800 font-medium">
                          T {t.table_number}
                        </div>
                      </td>

                      <td className="border-b border-r border-gray-300 px-2 py-0.5">
                        <div className="flex items-center justify-start h-full">
                          {t.qr_code ? (
                            <div className="p-0.5   ">
                              <img
                                src={t.qr_code}
                                alt="QR"
                                className="w-6 h-6 cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => setOpenQr(t.qr_code)}
                              />
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">
                              No QR
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="border-b border-gray-300 px-2 py-0.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(t)}
                            className="text-blue-500 hover:scale-110 transition"
                          >
                            <PencilIcon className="w-3.5 h-3.5 cursor-pointer" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTable(t);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-500 hover:scale-110 transition"
                          >
                            <TrashIcon className="w-4 h-4 cursor-pointer" />
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

        {/* QR MODAL */}
        {openQr && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={() => setOpenQr(null)}
          >
            <div
              className="relative bg-white p-4 rounded-lg max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <a
                href={openQr}
                download={`Table_${selectedTable?.table_number || "QR"}.png`}
                className="absolute top-2 right-2 text-gray-600 hover:text-amber-500"
                title="Download QR"
              >
                <Download className="h-5 w-5 cursor-pointer" />
              </a>

              <img
                src={openQr}
                alt={`Table ${selectedTable?.table_number} QR`}
                className="w-full h-auto object-contain"
              />

              <button
                onClick={() => setOpenQr(null)}
                className="mt-4 w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
