"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RestaurantPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState({
    restaurant_name: "",
    location: "",
    contact_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ---------------- FETCH Restaurants ----------------
  const fetchRestaurants = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      const res = await fetch(`${API_URL}/api/restaurants/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });

      const data = await res.json();
      console.log("API RESPONSE:", data); 

      if (Array.isArray(data)) {
        setRestaurants(data);
      } else if (Array.isArray(data.data)) {
        setRestaurants(data.data);
      } else {
        console.log("Unexpected API format", data);
        setRestaurants([]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // ---------------- CREATE / UPDATE Restaurant ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("adminToken");

      const url = editId
        ? `${API_URL}/api/restaurants/${editId}/`
        : `${API_URL}/api/restaurants/`;

      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) setMessage(data.message || "Error");
      else {
        setMessage(editId ? "Updated successfully!" : "Created successfully!");
        setForm({ restaurant_name: "", location: "", contact_number: "" });
        setShowModal(false);
        setEditId(null);
        fetchRestaurants();
      }
    } catch (err) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- DELETE Restaurant ----------------
  const handleDelete = async (id) => {
    if (!confirm("Delete this restaurant?")) return;

    try {
      const token = localStorage.getItem("adminToken");

      await fetch(`${API_URL}/api/restaurants/${id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      fetchRestaurants();
    } catch (err) {
      console.log(err);
    }
  };

  // ---------------- OPEN EDIT MODAL ----------------
  const handleEdit = (r) => {
    setForm({
      restaurant_name: r.restaurant_name,
      location: r.location,
      contact_number: r.contact_number,
    });

    setEditId(r.id || r._id);
    setShowModal(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-amber-600">Restaurants</h1>

      <button
        onClick={() => {
          setForm({ restaurant_name: "", location: "", contact_number: "" });
          setEditId(null);
          setShowModal(true);
        }}
        className="mb-6 bg-amber-500 text-white px-5 py-2 rounded-lg shadow hover:bg-amber-600 transition"
      >
        + Create Restaurant
      </button>

      {/* Table */}
      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-full bg-white rounded-lg">
          <thead className="bg-amber-400 text-white">
            <tr>
              <th className="px-6 py-3 text-left font-semibold">Name</th>
              <th className="px-6 py-3 text-left font-semibold">Location</th>
              <th className="px-6 py-3 text-left font-semibold">Phone</th>
              <th className="px-6 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr
                key={r.id || r._id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="px-6 py-3">{r.restaurant_name}</td>
                <td className="px-6 py-3">{r.location}</td>
                <td className="px-6 py-3">{r.contact_number}</td>
                <td className="px-6 py-3 flex gap-3">
                  <button
                    onClick={() => handleEdit(r)}
                    className="px-3 py-1 bg-amber-500 text-white rounded-md hover:bg-amber-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(r.id || r._id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-amber-50 bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-amber-600">
              {editId ? "Edit Restaurant" : "Create Restaurant"}
            </h2>

            {message && <p className="mb-4 text-red-500">{message}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.restaurant_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Location</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={form.contact_number}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
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
