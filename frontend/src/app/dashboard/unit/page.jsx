"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import toast from "react-hot-toast";

import "@/styles/customButtons.css";
import ToastProvider from "@/components/ToastProvider";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { X } from "lucide-react";
import HeaderWithSearch from "@/components/HeaderWithSearch";
import DeleteModal from "@/components/DeleteModal";
import CustomTable from "@/components/CustomTable";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

export default function AdminMenuUnitPage() {
  const [units, setUnits] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [unitName, setUnitName] = useState("");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [deleteUnit, setDeleteUnit] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const unitColumns = [
    {
      header: "S.N.",
      width: "50px",
      render: (_, index) => index + 1,
    },
    {
      header: "Name",
      render: (row) => (
        <div className="py-0.5 text-gray-800 font-medium">{row.name}</div>
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
            title="Edit"
          >
            <PencilIcon className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setDeleteUnit(row);
              setShowDeleteModal(true);
            }}
            className="text-red-500 hover:scale-110 transition cursor-pointer"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const fetchUnits = async () => {
    try {
      const token = getCookie("adminToken");
      if (!token) return;

      const res = await fetch(`${API_URL}/api/units/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setUnits(data.data || []);
    } catch (err) {
      toast.error("Failed to fetch units");
    }
  };

  const isFetched = useRef(false);
  useEffect(() => {
    if (!isFetched.current) {
      const loadInitialData = async () => {
        const token = getCookie("adminToken");
        if (token) {
          await Promise.all([fetchUnits()]);
        }
      };
      loadInitialData();
      isFetched.current = true;
    }
  }, []);
  const filteredUnits = useMemo(() => {
    return units.filter((u) =>
      u.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [units, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!unitName.trim()) return toast.error("Unit name required");
    setLoading(true);

    try {
      const token = getCookie("adminToken");
      if (!token) throw new Error("Login again");

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

      if (!res.ok) throw new Error("Save failed");

      toast.success(editId ? "Unit updated!" : "Unit created!");
      closeModal();
      fetchUnits();
    } catch (err) {
      toast.error(err.message);
    }

    setLoading(false);
  };

  const handleEdit = (unit) => {
    setEditId(unit.reference_id);
    setUnitName(unit.name);
    setShowForm(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteUnit) return;

    try {
      const token = getCookie("adminToken");
      const res = await fetch(
        `${API_URL}/api/units/${deleteUnit.reference_id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Token ${token}` },
        },
      );

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Unit deleted!");
      fetchUnits();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setShowDeleteModal(false);
      setDeleteUnit(null);
    }
  };

  const closeModal = () => {
    setShowForm(false);
    setEditId(null);
    setUnitName("");
  };

  return (
    <>
      <div className="mx-auto min-h-screen  font-sans p-4 bg-[#ddf4e2]">
        <ToastProvider />
        <HeaderWithSearch
          title="Unit"
          searchValue={search}
          onSearchChange={setSearch}
          onButtonClick={() => {
            setShowForm(true);
          }}
          buttonLabel="Create"
          placeholder="Search Unit..."
        />

        {showDeleteModal && (
          <DeleteModal
            branch={deleteUnit?.name}
            setShowDeleteModal={() => setShowDeleteModal(false)}
            handleDeleteConfirmed={handleDeleteConfirmed}
          />
        )}

        {/* FORM MODAL */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
            <div className="bg-white w-full max-w-[320px] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-[13px] font-bold text-gray-700">
                  {editId ? "Edit Unit" : "Add New Unit"}
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
                    Unit Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    placeholder="e.g. Kg, Plate, Piece"
                    className="w-full px-3 py-1.5 text-[12px] border border-gray-300 rounded focus:border-[#236B28] focus:ring-2 focus:ring-[#236B28]/10 outline-none transition-all placeholder:text-gray-400"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
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

        {/* UNIT TABLE */}
        {/* <div className="flex-1 min-h-0 bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden flex flex-col">
          <div
            className="flex-1 overflow-y-auto scrollbar-hide"
            style={{ maxHeight: "calc(100vh - 150px)" }}
          >
            <table className="min-w-full border-separate border-spacing-0 table-fixed text-[11px]">
              <thead className="sticky top-0 bg-[#fafafa] z-10">
                <tr>
                  {["S.N.", "Name", "Action"].map((header) => (
                    <th
                      key={header}
                      className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700 last:border-r-0"
                      style={{
                        width:
                          header === "SN"
                            ? "50px"
                            : header === "Action"
                              ? "90px"
                              : "auto",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white">
                {filteredUnits.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="text-center py-6 text-gray-400 border-b border-gray-300"
                    >
                      {search ? "No unit matches your search" : "No unit found"}
                    </td>
                  </tr>
                ) : (
                  filteredUnits.map((u, index) => (
                    <tr
                      key={u.reference_id}
                      className="hover:bg-blue-50/30 transition-all"
                    >
                      <td className="border-b border-r border-gray-300 px-2 py-0.5 last:border-r-0">
                        {index + 1}
                      </td>

                      <td className="border-b border-r border-gray-300 px-1 py-0.5 last:border-r-0">
                        <div className="px-1 py-0.5  text-gray-800 truncate">
                          {u.name}
                        </div>
                      </td>

                      <td className="border-b border-gray-300 px-2 py-0.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(u)}
                            className="text-blue-500 hover:scale-110 transition cursor-pointer"
                            title="Edit"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setDeleteUnit(u);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-500 hover:scale-110 transition cursor-pointer"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div> */}

        <CustomTable
          data={filteredUnits}
          columns={unitColumns}
          emptyMessage="No unit found"
          searchQuery={search}
        />
      </div>
    </>
  );
}
