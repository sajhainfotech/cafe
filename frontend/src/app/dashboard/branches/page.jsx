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
    <>
      <div className="flex flex-col items-start md:flex-row justify-between md:items-center bg-white shadow-md border border-gray-200  px-4 sm:px-6   md:px-10 py-2 md:pt-15 lg:py-3 gap-4 ">
        <div className="flex-1 pt-15 md:pt-0 lg:pt-0">
          <h1 className="text-lg sm:text-xl  md:text-2xl  lg-tesxt-3xl font-extrabold text-green-600 tracking-wide leading-tight ">
            Branches Management
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm md:text-base mt-1 md:mt-2">
            Manage all your branches here
          </p>
        </div>

        <div className="w-full md:w-auto flex justify-end">
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
            className="flex items-center justify-center gap-2 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl shadow-lg transition duration-300 cursor-pointer"
          >
            + Create Branches
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 min-h-screen font-roboto">
        <ToastProvider />

        <div className="overflow-x-auto rounded border border-blue-200">
           <div className="rounded overflow-hidden border border-gray-300">
          <table className="min-w-full border-collapse">
            <thead className="bg-blue-100 ">
              <tr>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm  uppercase">
                  Name
                </th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm uppercase">
                  Address
                </th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm uppercase">
                  Phone
                </th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm uppercase">
                  Restaurant
                </th>
                <th className="border border-gray-300 px-6 py-3 text-center text-sm uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {branches.length > 0 ? (
                branches.map((b, index) => (
                  <tr
                    key={b.reference_id || index}
                    className="hover:bg-blue-50 "
                  >
                    <td className="border px-3 py-2 font-medium ">{b.name}</td>
                    <td className="border px-6 py-3">{b.address}</td>
                    <td className="border px-6 py-3">{b.mobile_number}</td>
                    <td className="border px-6 py-3">{b.restaurant_name}</td>
                    <td className="border px-6 py-3">
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => handleEdit(b)}
                          className="text-blue-600 hover:bg-blue-100 p-2 rounded"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(b)}
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
                    colSpan={5}
                    className="border border-gray-300 text-center py-8 text-gray-400"
                  >
                    No branches found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-2 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scaleIn">
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-blue-600">
              {editId ? "Edit Branch" : "Create Branch"}
            </h2>

            {message && <p className="text-red-500 text-sm mb-2">{message}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Branch Name"
                required
                className="w-full border rounded-lg p-3 outline-none
      focus:border-blue-500
      focus:ring-1 focus:ring-blue-400 focus:ring-offset-1"
              />

              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Address"
                required
                className="w-full border rounded-lg p-3 outline-none
      focus:border-blue-500
      focus:ring-1 focus:ring-blue-400 focus:ring-offset-1"
              />

              <input
                name="mobile_number"
                value={form.mobile_number}
                onChange={handleChange}
                placeholder="Mobile Number"
                required
                className="w-full border rounded-lg p-3 outline-none
      focus:border-blue-500
      focus:ring-1 focus:ring-blue-400 focus:ring-offset-1"
              />

              <select
                name="restaurant_id"
                value={form.restaurant_id}
                onChange={handleChange}
                required
                className="w-full border rounded-lg p-3 outline-none
             bg-white text-gray-800
             focus:border-blue-500 focus:ring-1 focus:ring-blue-400 focus:ring-offset-1"
              >
                <option value="" className="text-gray-400">
                  Select Restaurant
                </option>
                {restaurants.map((r) => (
                  <option
                    key={r.reference_id}
                    value={r.reference_id}
                    className="text-green-800 bg-white hover:bg-blue-400 selected:bg-blue-500 selected:text-white"
                  >
                    {r.name}
                  </option>
                ))}
              </select>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-2 py-2 border border-gray-600 text-red-600 rounded-lg hover:bg-red-50 transition duration-200 font-medium cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg cursor-pointer"
                >
                  {loading ? "Saving..." : editId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
