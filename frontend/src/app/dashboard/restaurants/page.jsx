"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import toast, { Toaster } from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RestaurantPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    mobile_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

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
      setRestaurants(data.data || []);
    } catch (err) {
      console.error("FETCH ERROR:", err);
      toast.error("Failed to fetch restaurants");
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!form.name || !form.address || !form.mobile_number) {
      toast.error("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      const url = editId
        ? `${API_URL}/api/restaurants/${editId}/`
        : `${API_URL}/api/restaurants/`;
      const method = editId ? "PATCH" : "POST";

      const payload = {
        reference_id: editId ? undefined : uuidv4(),
        name: form.name.trim(),
        address: form.address.trim(),
        mobile_number: form.mobile_number.trim(),
      };
      if (editId) delete payload.reference_id;

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
        toast.error(data?.response || "Failed to save restaurant");
      } else {
        toast.success(editId ? "Updated!" : "Created!");
        setForm({ name: "", address: "", mobile_number: "" });
        setEditId(null);
        setShowModal(false);
        fetchRestaurants();
      }
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (restaurant) => {
    setForm({
      name: restaurant.name,
      address: restaurant.address,
      mobile_number: restaurant.mobile_number,
    });
    setEditId(restaurant.reference_id);
    setShowModal(true);
  };

  const handleDelete = async (restaurant) => {
    if (!confirm("Delete this restaurant?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(
        `${API_URL}/api/restaurants/${restaurant.reference_id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Token ${token}` },
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("DELETE FAILED:", text);
        toast.error("Failed to delete");
      } else {
        toast.success("Deleted!");
        fetchRestaurants();
      }
    } catch (err) {
      console.error("DELETE ERROR:", err);
      toast.error("Network error");
    }
  };

  return (
    <div className="p-6  min-h-screen">
      <Toaster position="top-right" />
      <h1 className="text-3xl font-bold mb-6 text-amber-600">Restaurants</h1>

      <button
        onClick={() => {
          setForm({ name: "", address: "", mobile_number: "" });
          setEditId(null);
          setShowModal(true);
        }}
        className="mb-6 bg-amber-500 text-white px-5 py-2 rounded-lg shadow"
      >
        + Create Restaurant
      </button>

      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-full bg-white rounded-lg">
          <thead className="bg-amber-400 text-white">
            <tr>
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Address</th>
              <th className="px-6 py-3 text-left">Phone</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr
                key={r.reference_id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="px-6 py-3">{r.name}</td>
                <td className="px-6 py-3">{r.address}</td>
                <td className="px-6 py-3">{r.mobile_number}</td>
                <td className="px-6 py-3 flex gap-3">
                  <button
                    onClick={() => handleEdit(r)}
                    className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {restaurants.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-400">
                  No restaurants found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {editId ? "Edit Restaurant" : "Create Restaurant"}
            </h2>
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
                maxLength={30}
                required
                className="w-full border p-2 rounded"
              />
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
