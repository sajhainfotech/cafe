"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BranchPage() {
  const [branches, setBranches] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    branch_name: "",
    location: "",
    contact_number: "",
    restaurant: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ---------------- Fetch Restaurants ----------------
  const fetchRestaurants = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      const res = await fetch(`${API_URL}/api/branches/`, {
        headers: { Authorization: `Token ${token}` },
      });

      const data = await res.json();

      if (Array.isArray(data)) setRestaurants(data);
      else if (Array.isArray(data.data)) setRestaurants(data.data);
    } catch (err) {
      console.log(err);
    }
  };

  // ---------------- Fetch Branches ----------------
  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      const res = await fetch(`${API_URL}/api/branches/`, {
        headers: { Authorization: `Token ${token}` },
      });

      const data = await res.json();

      if (Array.isArray(data)) setBranches(data);
      else if (Array.isArray(data.data)) setBranches(data.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchRestaurants();
    fetchBranches();
  }, []);

  // ---------------- Create / Update Branch ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("adminToken");

      const url = editId
        ? `${API_URL}/api/branches/${editId}/`
        : `${API_URL}/api/branches/`;

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

      if (!res.ok) {
        setMessage(data.message || "Error creating branch!");
      } else {
        setMessage(editId ? "Branch Updated!" : "Branch Created!");
        setShowModal(false);
        setEditId(null);
        setForm({
          branch_name: "",
          location: "",
          contact_number: "",
          restaurant: "",
        });
        fetchBranches();
      }
    } catch (err) {
      console.log(err);
      setMessage("Network Error");
    }

    setLoading(false);
  };

  // ---------------- Delete Branch ----------------
  const handleDelete = async (id) => {
    if (!confirm("Delete this branch?")) return;

    try {
      const token = localStorage.getItem("adminToken");

      await fetch(`${API_URL}/api/branches/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });

      fetchBranches();
    } catch (err) {
      console.log(err);
    }
  };

  // ---------------- Edit Modal Fill ----------------
  const handleEdit = (b) => {
    setForm({
      branch_name: b.branch_name,
      location: b.location,
      contact_number: b.contact_number,
      restaurant: b.restaurant,
    });
    setEditId(b.id || b._id);
    setShowModal(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-amber-600 mb-6">Branches</h1>

      <button
        onClick={() => {
          setForm({
            branch_name: "",
            location: "",
            contact_number: "",
            restaurant: "",
          });
          setEditId(null);
          setShowModal(true);
        }}
        className="mb-6 bg-amber-500 text-white px-5 py-2 rounded-lg shadow hover:bg-amber-600 transition"
      >
        + Create Branch
      </button>

      {/* Table */}
      <div className="overflow-x-auto shadow bg-white rounded-lg">
        <table className="w-full">
          <thead className="bg-amber-400 text-white">
            <tr>
              <th className="px-6 py-3 text-left">Branch Name</th>
              <th className="px-6 py-3 text-left">Location</th>
              <th className="px-6 py-3 text-left">Contact</th>
              <th className="px-6 py-3 text-left">Restaurant</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {branches.map((b) => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3">{b.branch_name}</td>
                <td className="px-6 py-3">{b.location}</td>
                <td className="px-6 py-3">{b.contact_number}</td>
                <td className="px-6 py-3">
                  {
                    restaurants.find((r) => r.id === b.restaurant)
                      ?.restaurant_name
                  }
                </td>

                <td className="px-6 py-3 flex gap-3">
                  <button
                    onClick={() => handleEdit(b)}
                    className="px-3 py-1 bg-amber-500 text-white rounded-md hover:bg-amber-600"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(b.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-amber-600">
              {editId ? "Edit Branch" : "Create Branch"}
            </h2>

            {message && <p className="mb-2 text-red-500">{message}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1">Branch Name</label>
                <input
                  type="text"
                  name="branch_name"
                  value={form.branch_name}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-1">Contact Number</label>
                <input
                  type="text"
                  name="contact_number"
                  value={form.contact_number}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block mb-1">Select Restaurant</label>
                <select
                  name="restaurant"
                  value={form.restaurant}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-lg"
                >
                  <option value="">-- Choose Restaurant --</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.restaurant_name}
                    </option>
                  ))}
                </select>
              </div>

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
                  className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
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
