"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import toast from "react-hot-toast";

import "@/styles/customButtons.css";
import ToastProvider from "@/components/ToastProvider";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { X } from "lucide-react";
import HeaderWithSearch from "@/components/HeaderWithSearch";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

export default function AdminCategoryManager() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchCategories = async () => {
    try {
      const token = getCookie("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/item-categories/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setCategories(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [categories, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = getCookie("adminToken");
      if (!token) throw new Error("Login again!");

      const payload = { name: categoryName, description };
      const url = editId
        ? `${API_URL}/api/item-categories/${editId}/`
        : `${API_URL}/api/item-categories/`;
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

      toast.success(editId ? "Category updated!" : "Category created!");
      closeModal();
      fetchCategories();
    } catch (err) {
      toast.error(err.message || "Error saving category");
    }
    setLoading(false);
  };

  const handleEdit = (cat) => {
    setEditId(cat.reference_id);
    setCategoryName(cat.name);
    setDescription(cat.description || "");
    setShowForm(true);
  };

  const closeModal = () => {
    setShowForm(false);
    setEditId(null);
    setCategoryName("");
    setDescription("");
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteCategory) return;

    try {
      const token = getCookie("adminToken");
      const res = await fetch(
        `${API_URL}/api/item-categories/${deleteCategory.reference_id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Token ${token}` },
        },
      );

      if (!res.ok) throw new Error("Delete failed");

      toast.success("Category deleted!");
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Delete failed");
    } finally {
      setShowDeleteModal(false);
      setDeleteCategory(null);
    }
  };

  return (
    <>
      <div className="min-h-screen mx-auto font-sans p-4 bg-[#ddf4e2]">
        <ToastProvider />

        {/* <div className="flex flex-col md:flex-row items-center justify-between gap-2 mb-2">
          <h1 className="self-start text-left text-[15px] font-bold text-[#236B28]">
            Categorie
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
                placeholder="Search Category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-[#236B28]/30 rounded-md pl-8 pr-3 py-1 text-[12px]
        focus:outline-none focus:ring-1 focus:ring-[#236B28]/40"
              />
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1 px-4 py-1.5 text-[12px] font-semibold
      bg-[#236B28] text-white rounded-md shadow-sm hover:bg-[#1C5721] transition"
            >
              Create
            </button>
          </div>
        </div> */}

        <HeaderWithSearch
          title="Categorie"
          searchValue={search}
          onSearchChange={setSearch}
          buttonLabel="Create"
          placeholder="Search Category..."
          onButtonClick={() => {
            setShowForm(true);
          }}
        />

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-md w-[90%] max-w-sm p-4">
              <h2 className="text-lg font-bold text-red-600 mb-3">
                Confirm Delete
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{deleteCategory?.name}</span>?
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

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[1px] p-3">
            <div className="bg-white w-full max-w-md rounded shadow-lg overflow-hidden animate-in fade-in zoom-in duration-150 border border-gray-300">
              <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 bg-white">
                <h2 className="text-[14px] font-semibold text-gray-800 tracking-tight">
                  {editId ? "Edit Category" : "Create Category"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-red-500 transition-all p-1 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div className="space-y-1">
                  <label className="block text-[12px] font-medium text-gray-600">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="e.g. Beverages"
                    className="w-full border border-gray-300 px-3 py-1.5 rounded text-[12px] focus:border-[#236B28] focus:ring-1 focus:ring-[#236B28]/20 outline-none transition-all placeholder:text-gray-400"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-medium text-gray-600">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description..."
                    rows={3}
                    className="w-full border border-gray-300 px-3 py-1.5 rounded text-[12px] focus:border-[#236B28] focus:ring-1 focus:ring-[#236B28]/20 outline-none transition-all placeholder:text-gray-400 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-50 mt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-1.5 bg-[#236B28] text-white rounded text-[12px] font-medium hover:bg-[#1C5721] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? "Saving..." : editId ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 bg-white rounded-md border border-gray-300 shadow-sm overflow-hidden flex flex-col">
          <div
            className="flex-1 overflow-y-auto scrollbar-hide"
            style={{ maxHeight: "calc(100vh - 150px)" }}
          >
            <table className="min-w-full border-separate border-spacing-0 table-fixed text-[11px]">
              <thead className="sticky top-0 bg-[#fafafa] z-10">
                <tr>
                  {["S.N.", "Name", "Description", "Action"].map((header) => (
                    <th
                      key={header}
                      className="border-b border-r border-gray-300 px-2 py-1 text-left font-bold text-gray-700 last:border-r-0"
                      style={{
                        width:
                          header === "SN"
                            ? "40px"
                            : header === "Action"
                              ? "80px"
                              : "auto",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-6 text-gray-400 border-b"
                    >
                      {search
                        ? "categories not match your search"
                        : "categories not found"}
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat, index) => (
                    <tr
                      key={cat.reference_id}
                      className="hover:bg-blue-50/30 transition-all"
                    >
                      <td className="border-b border-r border-gray-300 px-2 py-0.5 last:border-r-0">
                        {index + 1}
                      </td>

                      <td className="border-b border-r border-gray-300 px-1 py-0.5 last:border-r-0">
                        <div className=" px-1 py-0.5  text-gray-800 truncate">
                          {cat.name}
                        </div>
                      </td>

                      <td className="border-b border-r border-gray-300 px-1 py-0.5 last:border-r-0">
                        <div className=" px-1 py-0.5 bg-white  text-[12px] max-h-8 overflow-y-auto custom-scrollbar">
                          {cat.description || "-"}
                        </div>
                      </td>

                      <td className="border-b border-gray-300 px-2 py-0.5 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(cat)}
                            className="text-blue-500 hover:scale-110 transition cursor-pointer"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteCategory(cat);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-500 hover:scale-110 transition cursor-pointer"
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
        </div>
      </div>
    </>
  );
}
