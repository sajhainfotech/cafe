"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import ToastProvider from "@/components/ToastProvider";

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
  const [formDisabled, setFormDisabled] = useState(false);

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

      // Ensure res.data is an array
      const data = Array.isArray(res.data) ? res.data : [];
      setCategories(data);
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
    <div className="min-h-screen p-6 ">
      <ToastProvider />
      <h1 className="text-3xl font-bold text-amber-700 mb-6">
        Menu Categories
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow mb-6 max-w-md"
      >
        <h2 className="text-xl font-semibold mb-4">
          {editId ? "Edit" : "Add"} Category
        </h2>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Category Name</label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
            disabled={formDisabled}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            disabled={formDisabled}
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading || formDisabled}
          className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
        >
          {loading ? "Processing..." : editId ? "Update" : "Add"}
        </button>

        {editId && (
          <button
            type="button"
            onClick={() => {
              setEditId(null);
              setCategoryName("");
              setDescription("");
            }}
            className="ml-2 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            disabled={formDisabled}
          >
            Cancel
          </button>
        )}
      </form>

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Category List</h2>
        {categories.length === 0 ? (
          <p>No categories found</p>
        ) : (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Description</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(categories) && categories.length > 0 ? (
                categories.map((cat) => (
                  <tr key={cat.id || cat._id}>
                    <td className="border px-4 py-2">{cat.name}</td>
                    <td className="border px-4 py-2">
                      {cat.description || "-"}
                    </td>
                    <td className="border px-4 py-2 space-x-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        disabled={formDisabled}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id || cat._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        disabled={formDisabled}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="text-center py-2">
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default MenuCategoryPage;
