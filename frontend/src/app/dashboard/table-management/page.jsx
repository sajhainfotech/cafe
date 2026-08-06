"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import ToastProvider from "@/components/ToastProvider";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Download, X } from "lucide-react";
import "@/styles/customButtons.css";
import HeaderWithSearch from "@/components/HeaderWithSearch";
import { generateTableQR } from "@/lib/generateTableQR.js";
import DeleteModal from "@/components/DeleteModal";
import CustomTable from "@/components/CustomTable";
import CustomPagination from "@/components/CustomPagination";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

  const [validationError, setValidationError] = useState("");

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const tableColumns = [
    {
      header: "S.N.",
      width: "40px",
      render: (_, index) => (page - 1) * rowsPerPage + index + 1,
    },
    {
      header: "Table Name",
      render: (row) => (
        <div className="py-0.5 text-gray-800 font-medium">
          T {row.table_number}
        </div>
      ),
    },
    {
      header: "QR Code",
      width: "100px",
      render: (row) => (
        <div className="flex items-center">
          {row.qr_code ? (
            <img
              src={row.qr_code}
              alt="QR"
              className="w-6 h-6 cursor-pointer hover:scale-110 transition-transform"
              onClick={() => {
                setSelectedTable(row);
                setOpenQr(row.qr_code);
              }}
            />
          ) : (
            <span className="text-[10px] text-gray-400 italic">No QR</span>
          )}
        </div>
      ),
    },
    {
      header: "Action",
      width: "80px",
      render: (row) => (
        <div className="flex justify-end gap-1.5">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-500 hover:scale-110 transition cursor-pointer"
          >
            <PencilIcon className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setDeleteTable(row);
              setShowDeleteModal(true);
            }}
            className="text-red-500 hover:scale-110 transition cursor-pointer"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const fetchTables = async () => {
    try {
      const token = getCookie("adminToken");
      if (!token) return toast.error("Login first!");

      const res = await fetch(
        `${API_URL}/api/tables/?page=${page}&page_size=${rowsPerPage}`,
        {
          headers: { Authorization: `Token ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok || data.response_code !== "0")
        throw new Error(data.response || "Failed to fetch tables");

      const tablesWithQR = await Promise.all(
        (data.data?.results || []).map(async (t) => {
          const tokenNumber =
            t.token || new URL(t.qr_code_url || "").searchParams.get("token");
          const qrBase64 = await generateTableQR(tokenNumber);
          return { ...t, qr_code: qrBase64, token_number: tokenNumber };
        }),
      );

      setTables(tablesWithQR);
      setTotalCount(data?.data?.count || 0);
    } catch (err) {
      toast.error(err.message || "Failed to load tables");
      console.error(err);
    }
  };

  useEffect(() => {
    const token = getCookie("adminToken");
    if (token) {
      fetchTables();
    }
  }, [page, rowsPerPage]);

  const filteredTables = tables.filter((t) =>
    t.table_number.toString().includes(search.trim()),
  );

  useEffect(() => {
    setSearchQuery(search);
  }, [search]);

  const resetForm = () => {
    setTableName("");
    setEditId(null);
    setValidationError("");
  };

  const validateForm = () => {
    if (!tableName || tableName.trim() === "") {
      setValidationError("Table number is required");
      return false;
    }

    if (!editId) {
      const duplicate = tables.some(
        (t) => t.table_number.toString() === tableName.trim(),
      );
      if (duplicate) {
        setValidationError("Table number already exists");
        return false;
      }
    }

    setValidationError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateForm();
    if (!isValid) {
      const errorElement = document.querySelector(".border-red-500");
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        errorElement.focus();
      }
      return;
    }

    setLoading(true);
    try {
      const token = getCookie("adminToken");
      if (!token) throw new Error("Login required");

      const tableToken = editId
        ? tables.find((t) => t.reference_id === editId)?.token_number
        : Date.now().toString();

      const qr = tableToken ? await generateTableQR(tableToken) : "";

      const formData = new FormData();
      formData.append("table_number", tableName.trim());
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
    setValidationError("");
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
    <div className="mx-auto min-h-screen font-sans p-4 bg-[#ddf4e2]">
      <ToastProvider />

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
        <DeleteModal
          branch={deleteTable?.table_number}
          setShowDeleteModal={() => setShowDeleteModal(false)}
          handleDeleteConfirmed={handleDeleteConfirmed}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
          <div className="bg-white w-full max-w-[320px] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-[13px] font-bold text-gray-700">
                {editId ? "Edit Table" : "Add New Table"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="block text-[12px] font-semibold text-gray-600">
                  Table Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => {
                    setTableName(e.target.value);
                    if (validationError) {
                      setValidationError("");
                    }
                  }}
                  placeholder="e.g. 1"
                  className={`w-full px-3 py-1.5 text-[12px] border rounded focus:border-[#236B28] focus:ring-2 focus:ring-[#236B28]/10 outline-none transition-all placeholder:text-gray-400 ${
                    validationError ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                  autoFocus
                />
                {validationError && (
                  <p className="text-red-500 text-[10px] mt-0.5">
                    {validationError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-1.5 text-[12px] font-semibold text-gray-600 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
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

      <CustomTable
        data={filteredTables}
        columns={tableColumns}
        emptyMessage="No table found"
        searchQuery={searchQuery}
      />

      <CustomPagination
        page={page}
        setPage={setPage}
        rowsPerPage={rowsPerPage}
        setRowsPerPage={setRowsPerPage}
        totalCount={totalCount}
      />

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
  );
}
