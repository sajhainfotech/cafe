"use client";

import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminItemPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    item_name: "",
    description: "",
    imageFile: null,
    is_available: true,
    categories: [{ name: "", unit: "", price: "", imageFile: null }],
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const company = localStorage.getItem("companyId");

      if (!token || !company) return;

      const res = await fetch(`${API_URL}/api/menus/`, {
        method: "GET",
        headers: {
          Authorization: `Token ${token}`,
          Company: company,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch items");

      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      console.error(err);
      setItems([]);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleItemImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm({ ...form, imageFile: file });
  };

  const handleCategoryImage = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const updatedCategories = [...form.categories];
    updatedCategories[index].imageFile = file;
    setForm({ ...form, categories: updatedCategories });
  };

  const handleCategoryChange = (index, field, value) => {
    const updatedCategories = [...form.categories];
    updatedCategories[index][field] = value;
    setForm({ ...form, categories: updatedCategories });
  };

  const handleAddCategory = () => {
    setForm({
      ...form,
      categories: [
        ...form.categories,
        { name: "", unit: "", price: "", imageFile: null },
      ],
    });
  };

  const handleDeleteCategory = (index) => {
    const updatedCategories = form.categories.filter((_, i) => i !== index);
    setForm({ ...form, categories: updatedCategories });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("adminToken");
      // const company = localStorage.getItem("companyId");

      console.log(localStorage.getItem("adminToken"));
    

      // if (!token || !company) 
      if (!token ){
        alert("Please log in as admin or staff first!");
        setLoading(false);
        return;
      }

      const url = editId
        ? `${API_URL}/api/menus/${editId}/`
        : `${API_URL}/api/menus/`;
      const method = editId ? "PUT" : "POST";

      const formData = new FormData();
      formData.append("item_name", form.item_name);
      formData.append("description", form.description);
      formData.append("is_available", form.is_available);
      if (form.imageFile) formData.append("image", form.imageFile);

      form.categories.forEach((cat, index) => {
        formData.append(`categories[${index}][name]`, cat.name);
        formData.append(`categories[${index}][unit]`, cat.unit);
        formData.append(
          `categories[${index}][price]`,
          parseFloat(cat.price) || 0
        );
        if (cat.imageFile)
          formData.append(`categories[${index}][image]`, cat.imageFile);
      });

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Token ${token}`,
          // Company: company,
        },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to save item");
      }

      await res.json();
      fetchItems();

      setForm({
        item_name: "",
        description: "",
        imageFile: null,
        is_available: true,
        categories: [{ name: "", unit: "", price: "", imageFile: null }],
      });
      setEditId(null);
    } catch (err) {
      console.error("Submit error:", err);
      alert(err.message);
    }

    setLoading(false);
  };

  const editItem = (item) => {
    setForm({
      item_name: item.item_name,
      description: item.description,
      imageFile: null,
      is_available: item.is_available,
      categories: item.categories.map((c) => ({ ...c, imageFile: null })),
    });
    setEditId(item._id || item.id);
  };

  const deleteItem = async (id) => {
    if (!confirm("Delete this item?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      const company = localStorage.getItem("companyId");

      const res = await fetch(`${API_URL}/api/menus/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}`, Company: company },
      });

      if (!res.ok) throw new Error("Failed to delete item");

      fetchItems();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting item");
    }
  };

  return (
    <div className="container mx-auto p-4 font-sans">
      <h2 className="text-3xl font-bold text-center mb-6 text-amber-800">
        Item Management
      </h2>

      <div className="bg-white shadow-2xl rounded-3xl p-6 mb-6 border border-gray-200">
        <h4 className="text-2xl font-semibold mb-6 text-gray-700">
          {editId ? "Edit Item" : "Add New Item"}
        </h4>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium mb-2 text-gray-600">
                Item Name
              </label>
              <input
                type="text"
                placeholder="Item Name"
                value={form.item_name}
                onChange={(e) =>
                  setForm({ ...form, item_name: e.target.value })
                }
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-md"
                required
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block font-medium mb-2 text-gray-600">
                Description
              </label>
              <textarea
                placeholder="Optional description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-md"
              />
            </div>

            <div className="flex items-center mt-6 md:mt-0">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) =>
                  setForm({ ...form, is_available: e.target.checked })
                }
                className="h-6 w-6 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="ml-3 font-medium text-gray-700">Available</span>
            </div>

            <div className="col-span-1 md:col-span-2">
              <h4 className="text-xl font-semibold mb-3 text-gray-700">
                Categories
              </h4>
              {form.categories.map((cat, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center p-4 mb-3 rounded-2xl shadow-lg border border-gray-200"
                >
                  <input
                    type="text"
                    placeholder="Name"
                    value={cat.name}
                    onChange={(e) =>
                      handleCategoryChange(index, "name", e.target.value)
                    }
                    className="border rounded-2xl px-3 py-2 focus:ring-2 focus:ring-amber-500 shadow-sm"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={cat.unit}
                    onChange={(e) =>
                      handleCategoryChange(index, "unit", e.target.value)
                    }
                    className="border rounded-2xl px-3 py-2 focus:ring-2 focus:ring-amber-500 shadow-sm"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    value={cat.price}
                    onChange={(e) =>
                      handleCategoryChange(index, "price", e.target.value)
                    }
                    className="border rounded-2xl px-3 py-2 focus:ring-2 focus:ring-amber-500 shadow-sm"
                  />
                  <input
                    type="file"
                    onChange={(e) => handleCategoryImage(index, e)}
                    className="cursor-pointer rounded-xl px-2 py-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddCategory}
                className="bg-amber-500 text-white px-5 py-2 rounded-2xl shadow-md hover:bg-amber-700 transition"
              >
                + Add Category
              </button>
            </div>

            <div className="col-span-1 md:col-span-2 text-right mt-6">
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-500 font-bold text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-amber-700 transition"
              >
                {loading ? "Saving..." : editId ? "Update Item" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <h3 className="text-xl font-bold mb-4 text-gray-700">Items List</h3>
      <div className="overflow-x-auto bg-white shadow-2xl border border-gray-200 rounded-2xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-800 text-white rounded-t-2xl">
            <tr>
              <th className="px-4 py-3 text-left">Image</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Available</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr
                key={item._id || item.id}
                className="hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.item_name}
                      className="w-20 h-20 object-cover rounded-2xl shadow-sm"
                    />
                  )}
                </td>
                <td className="px-4 py-3">{item.item_name}</td>
                <td className="px-4 py-3">{item.description}</td>
                <td className="px-4 py-3">
                  {item.is_available ? "Yes" : "No"}
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button
                    className="bg-yellow-400 text-black px-3 py-1 rounded-xl hover:bg-yellow-500 shadow-sm transition"
                    onClick={() => editItem(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded-xl hover:bg-red-600 shadow-sm transition"
                    onClick={() => deleteItem(item._id || item.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-400">
                  No items added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
