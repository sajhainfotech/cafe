"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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

  const categoryColumns = [
    {
      header: "S.N.",
      width: "40px",
      render: (_, index) => index + 1,
    },
    {
      header: "Name",
      render: (row) => row.name,
    },
    {
      header: "Description",
      render: (row) => row.description,
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
              setDeleteCategory(row);
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

        <HeaderWithSearch
          title="Category"
          searchValue={search}
          onSearchChange={setSearch}
          buttonLabel="Create"
          placeholder="Search Category..."
          onButtonClick={() => {
            setShowForm(true);
          }}
        />

        {showDeleteModal && (
          <DeleteModal
            branch={deleteCategory?.name}
            setShowDeleteModal={() => {
              setShowDeleteModal(false);
            }}
            handleDeleteConfirmed={handleDeleteConfirmed}
          />
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

        <CustomTable
          data={filteredCategories}
          columns={categoryColumns}
          emptyMessage="No category found"
          searchQuery={search}
        />
      </div>
    </>
  );
}
