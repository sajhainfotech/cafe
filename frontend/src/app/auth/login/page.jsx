"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import ToastProvider from "@/components/ToastProvider";

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
      // Basic Auth Header
      const authHeader = "Basic " + btoa(`${username}:${password}`);

      // Login request
      const res = await fetch(`${API_URL}/api/user/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (!res.ok || !data?.is_staff) {
        toast.error("Invalid credentials or not admin!");
        setLoading(false);
        return;
      }

      localStorage.setItem("adminToken", data.token || "");
      localStorage.setItem("username", username || "");
      localStorage.setItem("restaurant_id", data.restaurant_id || "");
      localStorage.setItem("branch_id", data.branch_id || "");
      localStorage.setItem(
        "is_superuser",
        data.is_superuser ? "true" : "false"
      );

      if (data.is_superuser) {
        const r = await fetch(`${API_URL}/api/restaurants/`, {
          headers: { Authorization: `Token ${data.token}` },
        });
        const rData = await r.json();
        const restaurantData = rData.data || [];
        localStorage.setItem("restaurants", JSON.stringify(restaurantData));
      } else if (data.restaurant_id) {
        const r = await fetch(
          `${API_URL}/api/restaurants/${data.restaurant_id}/`,
          {
            headers: { Authorization: `Token ${data.token}` },
          }
        );
        const rData = await r.json();
        const restaurantData = rData.response ? [rData.response] : [];
        localStorage.setItem("restaurants", JSON.stringify(restaurantData));

        if (restaurantData.length > 0) {
          localStorage.setItem(
            "restaurant_id",
            restaurantData[0].id || restaurantData[0]._id
          );
        }
      }

      if (data.is_superuser) {
        const b = await fetch(`${API_URL}/api/branches/`, {
          headers: { Authorization: `Token ${data.token}` },
        });
        const bData = await b.json();
        const branchData = bData.data || [];
        localStorage.setItem("branches", JSON.stringify(branchData));
      } else if (data.branch_id) {
        const b = await fetch(`${API_URL}/api/branches/${data.branch_id}/`, {
          headers: { Authorization: `Token ${data.token}` },
        });
        const bData = await b.json();
        const branchData = bData.response ? [bData.response] : [];
        localStorage.setItem("branches", JSON.stringify(branchData));

        if (branchData.length > 0) {
          localStorage.setItem(
            "branch_id",
            branchData[0].id || branchData[0]._id
          );
        }
      }

      toast.success("Login successful!");
      if (data.is_superuser) {
        router.push("/dashboard");
      } else {
        router.push("/dashboard/orders");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Something went wrong! Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 px-4">
      <ToastProvider />
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-amber-600 text-center mb-4">
          Admin Login
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-md pr-10"
            />
            <div
              className="absolute top-9 right-3 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 text-white py-2 rounded-md"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
