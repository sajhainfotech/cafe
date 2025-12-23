"use client";

import { Trash2, Edit2, X } from "lucide-react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ToastProvider from "./ToastProvider";
import { useRef } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import "../styles/customButtons.css";

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
      if (data.data && data.data.length > 0) {
        console.log("Sample menu item_category:", data.data[0].item_category);
        console.log(
          "Sample menu item_category type:",
          typeof data.data[0].item_category
        );
        console.log("Sample menu unit:", data.data[0].unit);
        console.log("Sample menu unit type:", typeof data.data[0].unit);
      }
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

  // Helper function to extract ID from string representations like "ItemCategory object (17)"
  const extractIdFromString = (value) => {
    if (typeof value === "string" && value.includes("object")) {
      const match = value.match(/\((\d+)\)/);
      return match ? match[1] : null;
    }
    return null;
  };

  // Helper function to get category name
  const getCategoryName = (itemCategory) => {
    if (!itemCategory) return "N/A";

    // If it's an object with name property
    if (typeof itemCategory === "object" && itemCategory !== null) {
      if (itemCategory.name) return itemCategory.name;
      // Check for nested properties
      if (itemCategory.item_category && itemCategory.item_category.name) {
        return itemCategory.item_category.name;
      }
      // Check if it has an id or reference_id we can use to lookup
      const lookupId = itemCategory.reference_id || itemCategory.id;
      if (lookupId) {
        const found = categoriesList.find(
          (c) =>
            c.reference_id === lookupId ||
            (c.id && String(c.id) === String(lookupId))
        );
        if (found) return found.name;
      }
    }

    // If it's a string, try to find in list
    if (typeof itemCategory === "string" && itemCategory) {
      // First try direct match with reference_id
      const found = categoriesList.find((c) => c.reference_id === itemCategory);
      if (found) return found.name;

      // Try extracting ID from string representation like "ItemCategory object (17)"
      const extractedId = extractIdFromString(itemCategory);
      if (extractedId) {
        // Try to find by id (primary key) or reference_id
        const foundById = categoriesList.find((c) => {
          if (c.id && String(c.id) === extractedId) return true;
          if (c.reference_id === extractedId) return true;
          return false;
        });
        if (foundById) return foundById.name;
      }
    }

    return "N/A";
  };

  // Helper function to get unit name
  const getUnitName = (unit) => {
    if (!unit) return "N/A";

    // If it's an object with name property
    if (typeof unit === "object" && unit !== null) {
      if (unit.name) return unit.name;
      // Check for nested properties
      if (unit.unit && unit.unit.name) {
        return unit.unit.name;
      }
      // Check if it has an id or reference_id we can use to lookup
      const lookupId = unit.reference_id || unit.id;
      if (lookupId) {
        const found = units.find(
          (u) =>
            u.reference_id === lookupId ||
            (u.id && String(u.id) === String(lookupId))
        );
        if (found) return found.name;
      }
    }

    // If it's a string, try to find in list
    if (typeof unit === "string" && unit) {
      // First try direct match with reference_id
      const found = units.find((u) => u.reference_id === unit);
      if (found) return found.name;

      // Try extracting ID from string representation like "Unit object (7)"
      const extractedId = extractIdFromString(unit);
      if (extractedId) {
        // Try to find by id (primary key) or reference_id
        const foundById = units.find((u) => {
          if (u.id && String(u.id) === extractedId) return true;
          if (u.reference_id === extractedId) return true;
          return false;
        });
        if (foundById) return foundById.name;
      }
    }

    return "N/A";
  };

  // --- Form Handlers ---
  const handleCategoryChange = (index, field, value) => {
    const updated = [...form.categories];
    updated[index][field] = value;
    setForm({ ...form, categories: updated });
  };

  const handleCategoryImage = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1MB = 1024 * 1024 bytes
    const MAX_SIZE = 1024 * 1024;

    if (file.size > MAX_SIZE) {
      toast.error("Image size must be less than 1MB");
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      e.target.value = "";
      return;
    }

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

      form.categories.forEach((cat, index) => {
        const categoryJSON = {
          name: cat.name,
          price: cat.price,
          item_category: cat.item_category,
          unit: cat.unit,
        };
        formData.append(`items[${index}][name]`, cat.name);
        formData.append(`items[${index}][price]`, cat.price);
        formData.append(`items[${index}][item_category]`, cat.item_category);
        formData.append(`items[${index}][unit]`, cat.unit);

        if (cat.imageFile) {
          formData.append(`items[${index}][image]`, cat.imageFile);
        }
      });

      for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

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
    <div className="container min-h-screen font-sans">
      <ToastProvider />

      {!showForm && (
        <div className="flex flex-row items-center justify-between px-4 sm:px-6 md:px-10 py-3 gap-4">
          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600 leading-tight truncate">
              Menus Management
            </h1>
          </div>

          {/* Button */}
          <div className="flex-shrink-0 ml-4">
            <button
              onClick={() => setShowForm(true)}
              className="button flex items-center justify-center gap-2 bg-amber-500 text-black px-5 py-2 rounded-xl font-bold shadow-lg transition duration-300 cursor-pointer"
            >
              + Create
            </button>
          </div>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <div className="bg-white shadow-lg shadow-amber-100 rounded-xl p-4 sm:p-6 m-5 mb-6">
          <div className="flex flex-row justify-between items-center gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-amber-600 truncate">
              {editingMenuId ? "Edit Menu" : "Create Menu"}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-600 hover:text-red-600 font-medium"
            >
              <X size={20} />
            </button>
          </div>

          <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
            {/* MENU DATE */}
            <div>
              <label className="block mb-2 font-semibold">Menu Date</label>
              <input
                type="date"
                value={form.menu_date}
                onChange={(e) =>
                  setForm({ ...form, menu_date: e.target.value })
                }
                className="w-full border border-amber-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                required
              />
            </div>

            {/* CATEGORIES */}
            {form.categories.map((cat, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-4 border border-amber-200 p-4 rounded-lg shadow-sm items-center"
              >
                <input
                  type="text"
                  placeholder="Name"
                  value={cat.name}
                  onChange={(e) =>
                    handleCategoryChange(idx, "name", e.target.value)
                  }
                  className="w-full border border-amber-300 p-2 rounded-lg"
                  required
                />

                <input
                  type="number"
                  placeholder="Price"
                  value={cat.price}
                  onChange={(e) =>
                    handleCategoryChange(idx, "price", e.target.value)
                  }
                  className="w-full border border-amber-300 p-2 rounded-lg"
                  required
                />

                <select
                  value={cat.item_category}
                  onChange={(e) =>
                    handleCategoryChange(idx, "item_category", e.target.value)
                  }
                  className="w-full border border-amber-300 p-2 rounded-lg"
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
                  className="w-full border border-amber-300 p-2 rounded-lg"
                  required
                >
                  <option value="">Select Unit</option>
                  {units.map((u) => (
                    <option key={u.reference_id} value={u.reference_id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <div className="w-full flex flex-row items-center gap-2">
                  {/* Custom Upload Button */}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      id={`upload-${idx}`}
                      onChange={(e) => handleCategoryImage(idx, e)}
                      className="hidden"
                    />

                    <label
                      htmlFor={`upload-${idx}`}
                      className="block w-full text-center cursor-pointer hover:bg-amber-500 text-black font-semibold py-2 rounded-lg border border-amber-300 transition"
                    >
                      Uploads
                    </label>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteCategoryForm(idx)}
                    className="text-red-600 hover:text-red-800 flex justify-center p-2"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex flex-row sm:flex-row sm:justify-between gap-4 mt-6">
              {/* Add Category Button */}
              <button
                type="button"
                onClick={handleAddCategory}
                className="custom-btn w-full sm:w-auto"
              >
                + Add Category
              </button>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="custom-btn w-full sm:w-auto"
              >
                {loading ? "Saving..." : editingMenuId ? "Update" : "Create"}
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
                {[
                  "Menu Date",
                  "Name",
                  "Price",
                  "Item Category",
                  "Unit",
                  "Image",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="border border-gray-300 px-4 py-3 text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-amber-200 text-sm">
              {menus.map((menu) => (
                <tr
                  key={menu.reference_id}
                  className="border-b hover:bg-amber-50 transition"
                >
                  <td className="border px-4 py-2">{menu.menu_date}</td>
                  <td className="border px-4 py-2">{menu.name}</td>
                  <td className="border px-4 py-2">{menu.price}</td>
                  <td className="border px-4 py-2">
                    {getCategoryName(menu.item_category)}
                  </td>
                  <td className="border px-4 py-2">{getUnitName(menu.unit)}</td>
                  <td className="border px-4 py-2">
                    {menu.image || menu.image_url ? (
                      <img
                        src={menu.image || menu.image_url}
                        alt={menu.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded"
                      />
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td className="px-4 py-2 flex justify-center gap-4">
                    <button
                      onClick={() => {
                        handleEditMenu(menu);
                        setShowForm(true);
                      }}
                      className="text-amber-600 hover:bg-amber-100 p-2 rounded"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteMenu(menu.reference_id)}
                      className="text-red-600 hover:bg-red-100 p-2 rounded"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
