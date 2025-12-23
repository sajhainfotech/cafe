"use client";

import { useState, useEffect, useRef } from "react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";
import ToastProvider from "@/components/ToastProvider";
import AdminHeader from "@/components/AdminHeader";
import "@/styles/customButtons.css"


const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function BranchPage() {
  const formRef = useRef(null);
  const [showForm, setShowForm] = useState (false)
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
    setShowForm(true);


    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
    
  };

  return (
    <div className="container min-h-screen font-sans">
    <ToastProvider />
    <AdminHeader />
  
    {/* HEADER */}
    {!showForm && (
      <div
        className="flex flex-row items-center justify-between px-4 sm:px-6 md:px-10 py-3 gap-4"
      >
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600">
          Branches Management
        </h1>
  
        <button
          onClick={() => {
            setForm({
              name: "",
              address: "",
              mobile_number: "",
              restaurant_id: "",
            });
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
  
    {/* FORM */}
    {showForm && (
      <div className="bg-white shadow-lg shadow-amber-100 rounded-xl p-6 m-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-amber-600">
            {editId ? "Edit Branch" : "Add Branch"}
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
            placeholder="Branch Name"
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
  
          <select
            name="restaurant_id"
            value={form.restaurant_id}
            onChange={handleChange}
            required
            className="w-full border border-amber-300 p-3 rounded-lg
            focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="">Select Restaurant</option>
            {restaurants.map((r) => (
              <option key={r.reference_id} value={r.reference_id}>
                {r.name}
              </option>
            ))}
          </select>
  
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
              {["Name", "Address", "Phone", "Restaurant", "Actions"].map(
                (h) => (
                  <th key={h} className="border px-4 py-3 text-left">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
  
          <tbody className="bg-white divide-y divide-amber-200 text-sm">
            {branches.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-400">
                  No branches found
                </td>
              </tr>
            ) : (
              branches.map((b) => (
                <tr
                  key={b.reference_id}
                  className="border-b hover:bg-amber-50 transition"
                >
                  <td className="border px-4 py-2 font-medium">
                    {b.name}
                  </td>
                  <td className="border px-4 py-2">
                    {b.address}
                  </td>
                  <td className="border px-4 py-2">
                    {b.mobile_number}
                  </td>
                  <td className="border px-4 py-2">
                    {b.restaurant_name}
                  </td>
                  <td className="px-4 py-2 flex justify-center gap-3">
                    <button
                      onClick={() => handleEdit(b)}
                      className="text-amber-600 hover:bg-amber-100 p-2 rounded"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
  
                    <button
                      onClick={() => handleDelete(b)}
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
