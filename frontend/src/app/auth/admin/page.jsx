"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const AdminLoginPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {

     const authHeader = "Basic " + btoa(`${username}:${password}`);

    const res = await fetch(`${API_URL}/api/user/admin/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
       "Authorization": authHeader
      },
      
      body: JSON.stringify({}), 
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("Login successful!");
      localStorage.setItem("adminToken", data.token);
      router.push("/dashboard");
    } else {
      toast.error(data.message || "Invalid credentials!");
    }
  } catch (err) {
    console.log(err);
    toast.error("Something went wrong!");
  }

  setLoading(false);
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-amber-600 text-center mb-4">
          Admin Login
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Please login to access the dashboard
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter username"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="********"
            />
            <div
              className="absolute top-9 right-3 text-gray-500 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-2 rounded-md hover:bg-amber-700 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
