"use client";

import { useState, useEffect } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import ToastProvider from "@/components/ToastProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BranchPage() {
  const [branches, setBranches] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    mobile_number: "",
    restaurant_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  // Fetch restaurants
  const fetchRestaurants = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/api/restaurants/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      const data = await res.json();

      console.log("✅ RESTAURANTS RAW DATA:", data);

      setRestaurants(data.data || []);

      // Debug restaurant IDs
      (data.data || []).forEach((r) => {
        console.log(
          "🍽️ Restaurant:",
          r.name,
          "| reference_id:",
          r.reference_id
        );
      });

      return data.data || [];
    } catch (err) {
      console.log("❌ FETCH RESTAURANTS ERROR:", err);
      return [];
    }
  };

  // Fetch branches and map restaurant name
  const fetchBranches = async (restaurantList) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/api/branches/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
      const data = await res.json();

       console.log("🏢 BRANCHES RAW DATA:", data);

      const mappedBranches = (data.data || []).map((b) => {

         console.log(
          `🔗 Branch: ${b.name} | branch_ref_id=${b.reference_id} | restaurant_reference_id=${b.restaurant_reference_id}`
        );
        const restaurant = restaurantList.find(
          (r) => r.reference_id === b.restaurant_reference_id
        );

        console.log(
          `➡️ Mapped to Restaurant: ${
            restaurant?.name || "NOT FOUND"
          } (restaurant_reference_id: ${b.restaurant_reference_id})`
        );
        return {
          ...b,
          restaurant_name: restaurant?.name || "-",
        };
      });

      setBranches(mappedBranches);
    } catch (err) {
      console.log("❌ FETCH BRANCHES ERROR:", err);
    }
  };

  // Load restaurants first, then branches
  useEffect(() => {
    const loadData = async () => {
      const restaurantList = await fetchRestaurants();
      fetchBranches(restaurantList);
    };
    loadData();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { name, address, mobile_number, restaurant_id } = form;
    if (!name || !address || !mobile_number || !restaurant_id) {
      setMessage("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const url = editId
        ? `${API_URL}/api/branches/${editId}/`
        : `${API_URL}/api/branches/`;
      const method = editId ? "PATCH" : "POST";

      const payload = {
        name: name.trim(),
        address: address.trim(),
        mobile_number: mobile_number.trim(),
        restaurant_id,
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.response_code === "1") {
        setMessage(
          data?.errors ? JSON.stringify(data.errors) : data?.response || "Error"
        );
      } else {
        toast.success(editId ? "Branch updated!" : "Branch created!");
        setForm({
          name: "",
          address: "",
          mobile_number: "",
          restaurant_id: "",
        });
        setShowModal(false);
        setEditId(null);

        // 🔥 Auto-refresh branches after create/edit
        fetchBranches(restaurants);
      }
    } catch (err) {
      console.log("❌ SUBMIT ERROR:", err);
      toast.error("Network Error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (b) => {
    if (!confirm("Delete this branch?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API_URL}/api/branches/${b.reference_id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        console.log("❌ DELETE FAILED:", text);
        toast.error("Delete failed");
      } else {
        toast.success("Branch deleted successfully!");
        // 🔥 Auto-refresh branches after delete
        fetchBranches(restaurants);
      }
    } catch (err) {
      console.log("❌ DELETE ERROR:", err);
      toast.error("Network error");
    }
  };

  const handleEdit = (b) => {
    setForm({
      name: b.name,
      address: b.address,
      mobile_number: b.mobile_number,
      restaurant_id: b.restaurant_reference_id,
    });
    setEditId(b.reference_id);
    setShowModal(true);
  };

  return (
    <div className="p-6 min-h-screen">
      <ToastProvider />
      <h1 className="text-3xl font-bold mb-6 text-amber-600">Branches</h1>
      <button
        onClick={() => {
          setForm({
            name: "",
            address: "",
            mobile_number: "",
            restaurant_id: "",
          });
          setEditId(null);
          setShowModal(true);
        }}
        className="mb-6 bg-amber-500 text-white px-5 py-2 rounded-lg shadow cursor-pointer"
      >
        + Create Branch
      </button>

      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-full bg-white rounded-lg">
          <thead className="bg-amber-400 text-white">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Address</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Restaurant</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b, i) => (
              <tr key={b.reference_id || i} className="border-b">
                <td className="px-6 py-3">{b.name}</td>
                <td className="px-6 py-3">{b.address}</td>
                <td className="px-6 py-3">{b.mobile_number}</td>
                <td className="px-6 py-3">{b.restaurant_name}</td>
                <td className="px-6 py-3 flex gap-3">
                  <button
                    onClick={() => handleEdit(b)}
                    className="flex items-center gap-1 px-3 py-1 text-blue-500 transition"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b)}
                    className="flex items-center gap-1 px-3 py-1 text-red-500 transition"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0  bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {editId ? "Edit Branch" : "Create Branch"}
            </h2>
            {message && <p className="text-red-500">{message}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Name"
                maxLength={100}
                required
                className="w-full border p-2 rounded"
              />
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Address"
                maxLength={100}
                required
                className="w-full border p-2 rounded"
              />
              <input
                name="mobile_number"
                value={form.mobile_number}
                onChange={handleChange}
                placeholder="Mobile Number"
                maxLength={10}
                required
                className="w-full border p-2 rounded"
              />
              <select
                name="restaurant_id"
                value={form.restaurant_id}
                onChange={handleChange}
                required
                className="w-full border p-2 rounded"
              >
                <option value="">Select Restaurant</option>
                {restaurants.map((r) => (
                  <option key={r.reference_id} value={r.reference_id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-white rounded"
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
}
