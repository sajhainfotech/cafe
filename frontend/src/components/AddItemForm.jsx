"use client";

import { Trash2, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ToastProvider from "./ToastProvider";
import { useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminMenuManager() {
  const formRef = useRef(null);
  const [units, setUnits] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [menus, setMenus] = useState([]);
  const [form, setForm] = useState({
    menu_date: "",
    categories: [
      { name: "", price: "", item_category: "", unit: "", imageFile: null },
    ],
  });
  const [loading, setLoading] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState(null);
   const [showForm, setShowForm] = useState(false);

  // --- Fetch Units & Categories ---
  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/units/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setUnits(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch units");
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/item-categories/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setCategoriesList(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch categories");
    }
  };

  const fetchMenus = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/menus/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      console.log("Menus API Data:", data);
      setMenus(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch menus");
    }
  };

  useEffect(() => {
    fetchUnits();
    fetchCategories();
    fetchMenus();
  }, []);

  // --- Form Handlers ---
  const handleCategoryChange = (index, field, value) => {
    const updated = [...form.categories];
    updated[index][field] = value;
    setForm({ ...form, categories: updated });
  };

  const handleCategoryImage = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const updated = [...form.categories];
    updated[index].imageFile = file;
    setForm({ ...form, categories: updated });
  };

  const handleAddCategory = () => {
    setForm({
      ...form,
      categories: [
        ...form.categories,
        { name: "", price: "", item_category: "", unit: "", imageFile: null },
      ],
    });
  };

  const handleDeleteCategoryForm = (index) => {
    const updated = form.categories.filter((_, i) => i !== index);
    setForm({ ...form, categories: updated });
  };

  // --- Submit Menu ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Login again!");

      const formData = new FormData();
      formData.append("menu_date", form.menu_date);

      // form.categories.forEach((cat, index) => {
      //   if (!cat.name || !cat.price || !cat.item_category || !cat.unit) {
      //     throw new Error(`Category ${index + 1} has empty required fields`);
      //   }

      //   formData.append("name", cat.name);
      //   formData.append("price", cat.price);
      //   formData.append("item_category", cat.item_category);
      //   formData.append("unit", cat.unit);

      //   if (cat.imageFile) formData.append("imageFile", cat.imageFile);
      // });

      form.categories.forEach((cat, index) => {
        formData.append(`name_${index}`, cat.name);
        formData.append(`price_${index}`, cat.price);
        formData.append(`item_category_${index}`, cat.item_category);
        formData.append(`unit_${index}`, cat.unit);

        if (cat.imageFile) {
          formData.append(`imageFile_${index}`, cat.imageFile);
        }
      });

      const url = editingMenuId
        ? `${API_URL}/api/menus/${editingMenuId}/`
        : `${API_URL}/api/menus/`;
      const method = editingMenuId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Token ${token}` },
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok || resData.response_code !== "0") {
        const errorMessages = Object.values(resData.errors || {})
          .flat()
          .join(" | ");
        throw new Error(errorMessages || "Failed to save menu");
      }

      toast.success(editingMenuId ? "Menu updated!" : "Menu created!");
      setForm({
        menu_date: "",
        categories: [
          { name: "", price: "", item_category: "", unit: "", imageFile: "" },
        ],
      });
      setEditingMenuId(null);
      fetchMenus();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error saving menu");
    }
    setLoading(false);
  };

  const handleEditMenu = (menu) => {
    setEditingMenuId(menu.reference_id);

    setForm({
      menu_date: menu.menu_date,
      categories: [
        {
          name: menu.name || "",
          price: menu.price || "",
          item_category: menu.item_category || "",
          unit: menu.unit || "",
          imageFile: null,
        },
      ],
    });

   if (formRef.current) {
  formRef.current.scrollIntoView({
    behavior: "smooth", 
    block: "start",     
  });
}

  };

  const handleDeleteMenu = async (menuId) => {
    if (!confirm("Are you sure you want to delete this menu?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/api/menus/${menuId}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete menu");
      toast.success("Menu deleted!");
      fetchMenus();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Delete failed");
    }
  };


 const onSubmit = async (e) => {
    e.preventDefault();
    await handleSubmit(e);
    setShowForm(false); 
  };
  return (
    <div className="container mx-auto p-4 sm:p-6">
  <ToastProvider />

  {/* CREATE BUTTON + TITLE */}
  {!showForm && (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-blue-600">
        Menu Management
      </h2>
      <button
        onClick={() => setShowForm(true)}
        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold w-full sm:w-auto"
      >
        + Create Menu
      </button>
    </div>
  )}

  {/* FORM */}
  {showForm && (
    <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-blue-600">
          {editingMenuId ? "Edit Menu" : "Create Menu"}
        </h2>
        <button
          onClick={() => setShowForm(false)}
          className="text-red-600 hover:underline font-medium"
        >
          Cancel
        </button>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
        {/* MENU DATE */}
        <div>
          <label className="block mb-2 font-semibold text-blue-600">
            Menu Date
          </label>
          <input
            type="date"
            value={form.menu_date}
            onChange={(e) =>
              setForm({ ...form, menu_date: e.target.value })
            }
            className="w-full border border-blue-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        {/* CATEGORIES */}
        {form.categories.map((cat, idx) => (
          <div
            key={idx}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-4 border border-blue-200 p-4 rounded-lg shadow-sm items-center"
          >
            <input
              type="text"
              placeholder="Name"
              value={cat.name}
              onChange={(e) =>
                handleCategoryChange(idx, "name", e.target.value)
              }
              className="w-full border border-blue-300 p-2 rounded-lg"
              required
            />

            <input
              type="number"
              placeholder="Price"
              value={cat.price}
              onChange={(e) =>
                handleCategoryChange(idx, "price", e.target.value)
              }
              className="w-full border border-blue-300 p-2 rounded-lg"
              required
            />

            <select
              value={cat.item_category}
              onChange={(e) =>
                handleCategoryChange(idx, "item_category", e.target.value)
              }
              className="w-full border border-blue-300 p-2 rounded-lg"
              required
            >
              <option value="">Select Item Category</option>
              {categoriesList.map((c) => (
                <option key={c.reference_id} value={c.reference_id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={cat.unit}
              onChange={(e) =>
                handleCategoryChange(idx, "unit", e.target.value)
              }
              className="w-full border border-blue-300 p-2 rounded-lg"
              required
            >
              <option value="">Select Unit</option>
              {units.map((u) => (
                <option key={u.reference_id} value={u.reference_id}>
                  {u.name}
                </option>
              ))}
            </select>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleCategoryImage(idx, e)}
              className="w-full border border-blue-300 p-2 rounded-lg"
            />

            <button
              type="button"
              onClick={() => handleDeleteCategoryForm(idx)}
              className="text-red-600 hover:text-red-800 flex justify-center"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddCategory}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
        >
          + Add Category
        </button>

        {/* SUBMIT */}
        <div className="text-right">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 w-full sm:w-auto"
          >
            {loading
              ? "Saving..."
              : editingMenuId
              ? "Update Menu"
              : "Create Menu"}
          </button>
        </div>
      </form>
    </div>
  )}

  {/* MENU TABLE */}
  <h2 className="text-xl sm:text-2xl font-bold mb-4 text-blue-600">
    All Menus
  </h2>

  <div className="overflow-x-auto rounded-lg border border-blue-200">
    <table className="min-w-full">
      <thead className="bg-blue-50">
        <tr>
          <th className="px-4 py-2 border">Menu Date</th>
          <th className="px-4 py-2 border">Name</th>
          <th className="px-4 py-2 border">Price</th>
          <th className="px-4 py-2 border">Item Category</th>
          <th className="px-4 py-2 border">Unit</th>
          <th className="px-4 py-2 border">Image</th>
          <th className="px-4 py-2 border">Actions</th>
        </tr>
      </thead>

      <tbody>
        {menus.map((menu) => (
          <tr key={menu.reference_id} className="hover:bg-blue-50">
            <td className="px-4 py-2 border">{menu.menu_date}</td>
            <td className="px-4 py-2 border">{menu.name}</td>
            <td className="px-4 py-2 border">{menu.price}</td>
            <td className="px-4 py-2 border">
              {categoriesList.find(
                (c) => c.reference_id === menu.item_category
              )?.name || "N/A"}
            </td>
            <td className="px-4 py-2 border">
              {units.find((u) => u.reference_id === menu.unit)?.name || "N/A"}
            </td>
            <td className="px-4 py-2 border">
              {menu.imageFile || menu.image_url ? (
                <img
                  src={
                    menu.imageFile
                      ? URL.createObjectURL(menu.imageFile)
                      : menu.image_url
                  }
                  alt={menu.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded"
                />
              ) : (
                "No Image"
              )}
            </td>
            <td className="px-4 py-2 border flex justify-center gap-3">
              <button
                onClick={() => {
                  handleEditMenu(menu);
                  setShowForm(true);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleDeleteMenu(menu.reference_id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={18} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>

  );
}
