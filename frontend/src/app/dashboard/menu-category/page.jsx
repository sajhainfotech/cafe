"use client";

import { Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminItemPage() {
  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);
  const [unitForm, setUnitForm] = useState({ name: "", price: "" });
  const [unitEditId, setUnitEditId] = useState(null);

  const [form, setForm] = useState({
    item_name: "",
    description: "",
    imageFile: null,
    is_available: true,
    categories: [{ name: "", unit: "", price: "", imageFile: null }],
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("adminToken");
  const company = localStorage.getItem("companyId");

  // ----------- Fetch Units -----------
  const fetchUnits = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/units/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const data = await res.json();
      setUnits(data || []);
    } catch (err) {
      console.error("Unit fetch error:", err);
      setUnits([]);
    }
  };

  // ----------- Fetch Menu Items -----------
  const fetchItems = async () => {
    if (!token || !company) return;
    try {
      const res = await fetch(`${API_URL}/api/menus/`, {
        headers: { Authorization: `Token ${token}`, Company: company },
      });
      const data = await res.json();
      setItems(data || []);
    } catch (err) {
      console.error("Items fetch error:", err);
      setItems([]);
    }
  };

  useEffect(() => {
    fetchUnits();
    fetchItems();
  }, []);

  // ----------- Unit Handling -----------
  const handleUnitSubmit = async () => {
    if (!unitForm.name || !unitForm.price) {
      toast.error("All fields required for unit");
      return;
    }
    try {
      const url = unitEditId ? `${API_URL}/api/units/${unitEditId}/` : `${API_URL}/api/units/`;
      const method = unitEditId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
        body: JSON.stringify({ name: unitForm.name, price: parseFloat(unitForm.price) }),
      });
      if (!res.ok) throw new Error("Unit save failed");
      const newUnit = await res.json();

      toast.success(unitEditId ? "Unit updated" : "Unit created");

      // real-time update units list
      if (unitEditId) {
        setUnits(units.map(u => (u.id === unitEditId || u._id === unitEditId ? newUnit : u)));
      } else {
        setUnits([...units, newUnit]);
      }

      setUnitForm({ name: "", price: "" });
      setUnitEditId(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const editUnit = (u) => {
    setUnitForm({ name: u.name, price: u.price });
    setUnitEditId(u.id || u._id);
  };

  const deleteUnit = async (id) => {
    if (!confirm("Delete this unit?")) return;
    try {
      const res = await fetch(`${API_URL}/api/units/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete unit");

      toast.success("Unit deleted");
      setUnits(units.filter(u => u._id !== id && u.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Error deleting unit");
    }
  };

  // ----------- Menu Item Handling -----------
  const handleItemImage = (e) => {
    const file = e.target.files[0];
    setForm({ ...form, imageFile: file });
  };

  const handleCategoryImage = (index, e) => {
    const file = e.target.files[0];
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
      categories: [...form.categories, { name: "", unit: "", price: "", imageFile: null }],
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
      if (!token) throw new Error("Login required");
      const url = editId ? `${API_URL}/api/menus/${editId}/` : `${API_URL}/api/menus/`;
      const method = editId ? "PUT" : "POST";
      const formData = new FormData();
      formData.append("item_name", form.item_name);
      formData.append("description", form.description);
      formData.append("is_available", form.is_available);
      if (form.imageFile) formData.append("image", form.imageFile);

      form.categories.forEach((cat, index) => {
        formData.append(`categories[${index}][name]`, cat.name);
        formData.append(`categories[${index}][unit]`, cat.unit);
        formData.append(`categories[${index}][price]`, parseFloat(cat.price) || 0);
        if (cat.imageFile) formData.append(`categories[${index}][image]`, cat.imageFile);
      });

      const res = await fetch(url, { method, headers: { Authorization: `Token ${token}` }, body: formData });
      if (!res.ok) throw new Error("Failed to save item");
      await res.json();
      fetchItems();
      setForm({ item_name: "", description: "", imageFile: null, is_available: true, categories: [{ name: "", unit: "", price: "", imageFile: null }] });
      setEditId(null);
      toast.success(editId ? "Item updated" : "Item created");
    } catch (err) {
      console.error(err);
      toast.error(err.message);
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
      const res = await fetch(`${API_URL}/api/menus/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}`, Company: company },
      });
      if (!res.ok) throw new Error("Failed to delete item");
      toast.success("Item deleted");
      fetchItems();
    } catch (err) {
      console.error(err);
      toast.error("Error deleting item");
    }
  };

  return (
    <div className="container mx-auto p-4 font-sans">
      <Toaster position="top-right" />

      {/* Unit Management */}
      <div className="bg-white shadow-2xl rounded-3xl p-6 mb-6 border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Unit Management</h2>
        <div className="flex gap-3 mb-4">
          <input type="text" placeholder="Unit Name" value={unitForm.name} onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })} className="border px-3 py-2 rounded-lg w-1/3" />
          <input type="number" placeholder="Unit Price" value={unitForm.price} onChange={(e) => setUnitForm({ ...unitForm, price: e.target.value })} className="border px-3 py-2 rounded-lg w-1/3" />
          <button onClick={handleUnitSubmit} className="bg-amber-500 text-white px-4 py-2 rounded-lg">{unitEditId ? "Update Unit" : "Add Unit"}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {units.map(u => (
                <tr key={u.id || u._id}>
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.price}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => editUnit(u)} className="bg-yellow-400 px-3 py-1 rounded-lg">Edit</button>
                    <button onClick={() => deleteUnit(u.id || u._id)} className="bg-red-500 text-white px-3 py-1 rounded-lg">Delete</button>
                  </td>
                </tr>
              ))}
              {units.length === 0 && (
                <tr><td colSpan="3" className="text-center py-4 text-gray-400">No units yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Menu Item Management */}
      <div className="bg-white shadow-2xl rounded-3xl p-6 mb-6 border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">{editId ? "Edit Item" : "Add New Item"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Item Name" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} className="border px-3 py-2 rounded-lg w-full" required />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border px-3 py-2 rounded-lg w-full md:col-span-2" />
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
              <span>Available</span>
            </div>
            <input type="file" onChange={handleItemImage} className="md:col-span-2" />
            {/* Categories */}
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-2">Categories</h3>
              {form.categories.map((cat, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2 border p-2 rounded-lg">
                  <input placeholder="Category Name" value={cat.name} onChange={(e) => handleCategoryChange(idx, "name", e.target.value)} className="border px-2 py-1 rounded-lg" />
                  <select value={cat.unit} onChange={(e) => handleCategoryChange(idx, "unit", e.target.value)} className="border px-2 py-1 rounded-lg">
                    <option value="">Select Unit</option>
                    {units.map(u => <option key={u.id || u._id} value={u.name}>{u.name}</option>)}
                  </select>
                  <input placeholder="Price" type="number" value={cat.price} onChange={(e) => handleCategoryChange(idx, "price", e.target.value)} className="border px-2 py-1 rounded-lg" />
                  <input type="file" onChange={(e) => handleCategoryImage(idx, e)} className="border px-2 py-1 rounded-lg" />
                  <button type="button" onClick={() => handleDeleteCategory(idx)} className="text-red-500"><Trash2 size={20} /></button>
                </div>
              ))}
              <button type="button" onClick={handleAddCategory} className="bg-amber-500 text-white px-3 py-1 rounded-lg">+ Add Category</button>
            </div>
            <button type="submit" disabled={loading} className="bg-amber-500 text-white px-4 py-2 rounded-lg md:col-span-2">{loading ? "Saving..." : editId ? "Update Item" : "Save Item"}</button>
          </div>
        </form>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto bg-white shadow-2xl border border-gray-200 rounded-2xl">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-4 py-2">Image</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Available</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item._id || item.id}>
                <td>{item.image && <img src={item.image} className="w-16 h-16 object-cover rounded-lg" />}</td>
                <td>{item.item_name}</td>
                <td>{item.description}</td>
                <td>{item.is_available ? "Yes" : "No"}</td>
                <td className="flex gap-2">
                  <button onClick={() => editItem(item)} className="bg-yellow-400 px-3 py-1 rounded-lg">Edit</button>
                  <button onClick={() => deleteItem(item._id || item.id)} className="bg-red-500 text-white px-3 py-1 rounded-lg">Delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="5" className="text-center py-4 text-gray-400">No items yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
