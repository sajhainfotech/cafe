"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

import ToastProvider from "@/components/ToastProvider";
import AdminHeader from "@/components/AdminHeader";

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
    <>
      <AdminHeader />
      <div className="px-4 sm:px-6 md:px-10 py-3">
        <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
          {/* LEFT CONTENT */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 leading-tight truncate">
              Restaurants Management
            </h1>
           
          </div>

         
          <button
            onClick={() => {
              setForm({ name: "", address: "", mobile_number: "" });
              setEditId(null);
              setShowModal(true);
            }}
            className="flex-shrink-0 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl shadow-lg transition cursor-pointer"
          >
            + Create
          </button>
        </div>
      </div>

      <div className="p-4 md:p-4 min-h-screen font-roboto ">
        <ToastProvider position="top-right" />

        <div className="overflow-x-auto rounded border border-blue-200">
          <div className="rounded overflow-hidden border border-gray-300">
            <table className="min-w-full border-collapse">
              <thead className="bg-blue-100">
                <tr>
                  <th className="border border-gray-300 px-6 py-3 text-left text-sm  uppercase ">
                    Name
                  </th>
                  <th className="border border-gray-300 px-6 py-2 text-left text-sm  uppercase ">
                    Address
                  </th>
                  <th className="border border-gray-300 px-6 py-3 text-left text-sm  uppercase ">
                    Phone
                  </th>
                  <th className="border border-gray-300 px-6 py-3 text-center text-sm  uppercase ">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {restaurants.length > 0 ? (
                  restaurants.map((r) => (
                    <tr key={r.reference_id} className="hover:bg-blue-50 ">
                      <td className="border  px-3 py-2 font-medium text-gray-700">
                        {r.name}
                      </td>
                      <td className="border  px-6 py-3 ">{r.address}</td>
                      <td className="border  px-6 py-3 ">{r.mobile_number}</td>
                      <td className="border  px-6 py-3">
                        <div className="flex justify-center gap-4">
                          <button
                            onClick={() => handleEdit(r)}
                            className="text-blue-600 hover:bg-blue-100 p-2 rounded"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r)}
                            className="text-red-600 hover:bg-red-100 p-2 rounded"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="border  text-center py-8 text-gray-400"
                    >
                      No restaurants found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-2 sm:p-4 md:p-6 animate-fadeIn">
            <div className="bg-white rounded-2xl w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg p-4 sm:p-6 md:p-8 shadow-2xl animate-scaleIn">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 text-blue-700">
                {editId ? "Edit Restaurant" : "Create Restaurant"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Restaurant Name"
                  required
                  className="w-full border rounded-lg p-2 sm:p-3 outline-none
      text-sm sm:text-base md:text-base
      focus:border-blue-500
      focus:ring-1 focus:ring-blue-400 focus:ring-offset-1"
                />

                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Address"
                  required
                  className="w-full border rounded-lg p-2 sm:p-3 outline-none
      text-sm sm:text-base md:text-base
      focus:border-blue-500
      focus:ring-1 focus:ring-blue-400 focus:ring-offset-1"
                />

                <input
                  name="mobile_number"
                  value={form.mobile_number}
                  onChange={handleChange}
                  placeholder="Mobile Number"
                  required
                  className="w-full border rounded-lg p-2 sm:p-3 outline-none
      text-sm sm:text-base md:text-base
      focus:border-blue-500
      focus:ring-1 focus:ring-blue-400 focus:ring-offset-1"
                />

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-2 py-2 border border-gray-600 rounded-lg font-medium text-red-500 hover:bg-red-100
        w-full sm:w-auto text-sm sm:text-base cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700
        text-white rounded-lg shadow 
        w-full sm:w-auto text-sm sm:text-base font-medium cursor-pointer"
                  >
                    {loading ? "Saving..." : editId ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
