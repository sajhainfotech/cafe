"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminRegisterPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [adminToken, setAdminToken] = useState("");

  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile_number: "",
    restaurant: "",
    branch: "",
  });

  // Fetch token on mount
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      toast.error("Admin token not found. Please login first.");
      return;
    }
    setAdminToken(token);

    fetchRestaurants(token);
    fetchBranches(token);
  }, []);

  const fetchRestaurants = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/restaurants/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch restaurants");
      const data = await res.json();
      setRestaurants(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch restaurants.");
    }
  };

  const fetchBranches = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/branches/`, {
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch branches");
      const data = await res.json();
      setBranches(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch branches.");
    }
  };

  // Filter branches based on selected restaurant
  useEffect(() => {
    if (form.restaurant) {
      const filtered = branches.filter(
        (b) => b.restaurant_reference_id === form.restaurant
      );
      setFilteredBranches(filtered);
    } else {
      setFilteredBranches([]);
    }
    setForm((prev) => ({ ...prev, branch: "" }));
  }, [form.restaurant, branches]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adminToken) return toast.error("Admin token missing!");
    const requiredFields = ["username","password","first_name","last_name","email","mobile_number","restaurant","branch"];
    for (let field of requiredFields) {
      if (!form[field]) return toast.error(`Please fill ${field}`);
    }

    try {
      const res = await fetch(`${API_URL}/api/user/admins/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${adminToken}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Backend Error:", data);
        return toast.error(data.response || "Registration failed");
      }

      toast.success("Admin registered successfully!");

      setForm({
        username: "",
        password: "",
        first_name: "",
        last_name: "",
        email: "",
        mobile_number: "",
        restaurant: "",
        branch: "",
      });
    } catch (err) {
      console.error("Frontend Error:", err);
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center px-3">
      <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl p-5">
        <h2 className="text-3xl font-bold text-amber-600 text-center mb-8">
          Admin Register
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="text" placeholder="Username" value={form.username} onChange={(e)=>setForm({...form,username:e.target.value})} required className="w-full border p-3 rounded-lg"/>
          <input type="password" placeholder="Password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} required className="w-full border p-3 rounded-lg"/>
          <input type="text" placeholder="First Name" value={form.first_name} onChange={(e)=>setForm({...form,first_name:e.target.value})} required className="w-full border p-3 rounded-lg"/>
          <input type="text" placeholder="Last Name" value={form.last_name} onChange={(e)=>setForm({...form,last_name:e.target.value})} required className="w-full border p-3 rounded-lg"/>
          <input type="email" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required className="w-full border p-3 rounded-lg"/>
          <input type="text" placeholder="Mobile Number" value={form.mobile_number} onChange={(e)=>setForm({...form,mobile_number:e.target.value})} required className="w-full border p-3 rounded-lg md:col-span-2"/>

          <select value={form.restaurant} onChange={(e)=>setForm({...form,restaurant:e.target.value})} required className="w-full border p-3 rounded-lg">
            <option value="">Select Restaurant</option>
            {restaurants.map((r)=>(
              <option key={r.reference_id} value={r.reference_id}>{r.name}</option>
            ))}
          </select>

          <select value={form.branch} onChange={(e)=>setForm({...form,branch:e.target.value})} required className="w-full border p-3 rounded-lg">
            <option value="">Select Branch</option>
            {filteredBranches.map((b)=>(
              <option key={b.reference_id} value={b.reference_id}>{b.name}</option>
            ))}
          </select>

          <button type="submit" className="w-full md:col-span-2 bg-amber-500 text-white p-3 rounded-lg hover:bg-amber-600 font-semibold">Register Admin</button>
        </form>
      </div>
    </div>
  );
}


