"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import ToastProvider from "@/components/ToastProvider";
import AdminHeader from "../../../components/AdminHeader";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

const MenuCategoryPage = () => {
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  const [token, setToken] = useState(null);
  const [restaurant_id, setRestaurantId] = useState(null);
  const [branch_id, setBranchId] = useState(null);

  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [setFormDisabled] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Load token and IDs from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const t = localStorage.getItem("adminToken");
      const r = localStorage.getItem("restaurant_id");
      const b = localStorage.getItem("branch_id");

      setToken(t);
      setRestaurantId(r);
      setBranchId(b);

      if (!t) toast.error("Token not found. Please login again!");
      if (!r || !b) {
        setFormDisabled(true);
        toast.error("Branch or Restaurant not assigned. Contact admin!");
      }
    }
  }, []);

  // Fetch categories
  const fetchCategories = async () => {
    if (!token) return;

    try {
      const res = await axios.get(`${BASE_URL}/api/item-categories/`, {
        headers: { Authorization: `Token ${token}` },
      });
      console.table(res.data.data);
      // Ensure res.data is an array
      const data = Array.isArray(res.data) ? res.data : [];
      setCategories(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch categories.");
      setCategories([]); // fallback
    }
  };

  useEffect(() => {
    if (token && restaurant_id && branch_id) fetchCategories();
  }, [token, restaurant_id, branch_id]);

  // Add / Update category
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName) return toast.error("Category name is required!");
    if (!restaurant_id || !branch_id)
      return toast.error("Branch/Restaurant not assigned.");

    setLoading(true);
    try {
      const payload = {
        name: categoryName,
        description,
        restaurant_id,
        branch_id,
      };

      if (editId) {
        // PATCH request for update
        await axios.patch(
          `${BASE_URL}/api/item-categories/${editId}/`,
          payload,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        toast.success("Category updated successfully");
      } else {
        // POST request for new category
        await axios.post(`${BASE_URL}/api/item-categories/`, payload, {
          headers: { Authorization: `Token ${token}` },
        });
        toast.success("Category added successfully");
      }

      setCategoryName("");
      setDescription("");
      setEditId(null);
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add/update category.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat) => {
    setCategoryName(cat.name);
    setDescription(cat.description || "");
    setEditId(cat.id || cat._id);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/item-categories/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete category.");
    }
  };

  return (
    <div className="min-h-screen ">
      {/* HEADER */}
      <AdminHeader />
      <ToastProvider />

      {/* PAGE HEADER */}
      <div className=" px-4 sm:px-6 md:px-10 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-700">
              Menu Categories
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage all your menu categories here
            </p>
          </div>

          <button
            onClick={() => {
              setEditId(null);
              setCategoryName("");
              setDescription("");
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl shadow-lg transition duration-300 cursor-pointer"
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 md:p-6">
        <div className="overflow-x-auto rounded border border-blue-200">
          <table className="min-w-full border-collapse">
            <thead className="bg-blue-50 uppercase text-sm">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  Name
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  Description
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-gray-400">
                    No categories found
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="border-b hover:bg-gray-50">
                    <td className="border px-4 py-2">{cat.name}</td>
                    <td className="border px-4 py-2">
                      {cat.description || "-"}
                    </td>
                    <td className="border px-4 py-2">
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="text-blue-600 hover:underline"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="text-red-600 hover:underline"
                        >
                          <TrashIcon className="w-5 h-5" />
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

      {/* MODAL FORM */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative animate-fadeIn">
            {/* CLOSE */}
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
            >
              ✕
            </button>

            <h2 className="text-xl font-semibold mb-4 text-blue-700">
              {editId ? "Edit Category" : "Add Category"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-2 py-2 border border-red-500 hover:bg-red-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg cursor-pointer"
                >
                  {loading ? "Saving..." : editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuCategoryPage;
