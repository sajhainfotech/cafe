"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

import ToastProvider from "@/components/ToastProvider";
import AdminHeader from "@/components/AdminHeader";
import "@/styles/customButtons.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RestaurantPage() {
  const [restaurants, setRestaurants] = useState([]);
  const formRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    mobile_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
    setShowForm(true);
    // setShowModal(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
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
    <div className="container min-h-screen font-sans">
      <ToastProvider />
      <AdminHeader />

      {/* Header */}
      {!showForm && (
        <div className="flex flex-row items-center justify-between px-4 sm:px-6 md:px-10 py-3 gap-4">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600">
            Restaurants Management
          </h1>

          <button
            onClick={() => {
              setForm({ name: "", address: "", mobile_number: "" });
              setEditId(null);
              setShowForm(true);
            }}
            className="button flex items-center justify-center gap-2
          bg-amber-500 text-black px-5 py-2 rounded-xl
          font-bold shadow-lg transition cursor-pointer"
          >
            + Create
          </button>
        </div>
      )}

      {/* FORM (Same as Table UI) */}
      {showForm && (
        <div
          ref={formRef}
          className="bg-white shadow-lg shadow-amber-100 rounded-xl p-6 m-5"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-amber-600">
              {editId ? "Edit Restaurant" : "Add Restaurant"}
            </h2>

            <button
              onClick={() => setShowForm(false)}
              className="text-gray-600 hover:text-red-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Restaurant Name"
              required
              className="w-full border border-amber-300 p-3 rounded-lg
            focus:ring-2 focus:ring-amber-400"
            />

            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
              required
              className="w-full border border-amber-300 p-3 rounded-lg
            focus:ring-2 focus:ring-amber-400"
            />

            <input
              name="mobile_number"
              value={form.mobile_number}
              onChange={handleChange}
              placeholder="Mobile Number"
              required
              className="w-full border border-amber-300 p-3 rounded-lg
            focus:ring-2 focus:ring-amber-400"
            />

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-amber-500
              hover:bg-amber-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="custom-btn w-full sm:w-auto cursor-pointer"
              >
                {loading ? "Saving..." : editId ? "Update" : "Create"}
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
                {["Name", "Address", "Phone", "Actions"].map((h) => (
                  <th key={h} className="border px-4 py-3 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-amber-200 text-sm">
              {restaurants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-400">
                    No restaurants found
                  </td>
                </tr>
              ) : (
                restaurants.map((r) => (
                  <tr
                    key={r.reference_id}
                    className="border-b hover:bg-amber-50 transition"
                  >
                    <td className="border px-4 py-2 font-medium">{r.name}</td>
                    <td className="border px-4 py-2">{r.address}</td>
                    <td className="border px-4 py-2">{r.mobile_number}</td>
                    <td className="px-4 py-2 flex justify-center gap-3">
                      <button
                        onClick={() => handleEdit(r)}
                        className="text-amber-600 hover:bg-amber-100 p-2 rounded"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => handleDelete(r.reference_id)}
                        className="text-red-600 hover:bg-red-100 p-2 rounded"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
