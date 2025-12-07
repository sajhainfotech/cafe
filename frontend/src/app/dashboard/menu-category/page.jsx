"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API; 

export default function MenuCategoryPage() {
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);

  const [formData, setFormData] = useState({
    category_name: "",
    description: "",
  });

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/api/category`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.log("Error fetching categories", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle input change
  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  // Save or update Category
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (editing) {
        res = await fetch(`${API_URL}/api/category/${editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        res = await fetch(`${API_URL}/api/category`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      await res.json();
      setEditing(null);
      setFormData({ category_name: "", description: "" });
      fetchCategories();
    } catch (err) {
      console.log("Save failed:", err);
    }
  };

  // Delete Category
  const deleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return;

    try {
      await fetch(`${API_URL}/api/category/${id}`, { method: "DELETE" });
      fetchCategories();
    } catch (err) {
      console.log("Delete failed:", err);
    }
  };

  // Open Edit Form
  const openEditForm = (cat) => {
    setEditing(cat._id);
    setFormData({
      category_name: cat.category_name,
      description: cat.description,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Form */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6 border">
        <h2 className="text-2xl font-semibold mb-4">
          {editing ? "Edit Category" : "Add Category"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-medium">Category Name</label>
            <input
              type="text"
              name="category_name"
              value={formData.category_name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-amber-500"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 text-white py-2 rounded-xl mt-2 hover:opacity-80 transition"
          >
            {editing ? "Update Category" : "Save Category"}
          </button>
          {editing && (
            <button
              type="button"
              className="w-full bg-gray-300 text-gray-700 py-2 rounded-xl mt-2 hover:opacity-80 transition"
              onClick={() => {
                setEditing(null);
                setFormData({ category_name: "", description: "" });
              }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {/* Category List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className="bg-white rounded-2xl shadow-md p-5 border hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold text-gray-800">{cat.category_name}</h2>
            <p className="text-gray-500 mt-1">{cat.description}</p>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => openEditForm(cat)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Pencil className="text-blue-600" />
              </button>

              <button
                onClick={() => deleteCategory(cat._id)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Trash2 className="text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
