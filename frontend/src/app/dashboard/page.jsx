"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Building2,
  Table,
  LogOut,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [branchName, setBranchName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      router.push("/");
      return;
    }

    setAdminName(localStorage.getItem("username") || "Admin");
    setRestaurantName(localStorage.getItem("restaurantName") || "N/A");
    setBranchName(localStorage.getItem("branchName") || "N/A");
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-amber-600 text-white p-6 space-y-6">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>

        <nav className="space-y-2">
          <button
            className="flex items-center gap-3 p-3 rounded hover:bg-amber-700 w-full text-left"
            onClick={() => router.push("/dashboard")}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>

          <button
            className="flex items-center gap-3 p-3 rounded hover:bg-amber-700 w-full text-left"
            onClick={() => router.push("/dashboard/restaurants")}
          >
            <Store size={20} /> Restaurants
          </button>

          <button
            className="flex items-center gap-3 p-3 rounded hover:bg-amber-700 w-full text-left"
            onClick={() => router.push("/dashboard/branches")}
          >
            <Building2 size={20} /> Branches
          </button>

          <button
            className="flex items-center gap-3 p-3 rounded hover:bg-amber-700 w-full text-left"
            onClick={() => router.push("/dashboard/tables")}
          >
            <Table size={20} /> Tables
          </button>

          <button
            className="flex items-center gap-3 p-3 rounded bg-red-500 mt-10 hover:bg-red-600 w-full text-left"
            onClick={handleLogout}
          >
          
            <LogOut size={20} /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-amber-700">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome, <strong>{adminName}</strong>
        </p>

        {/* Restaurant & Branch info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-amber-600">Restaurant</h3>
            <p className="text-gray-700 mt-1">{restaurantName}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-amber-600">Branch</h3>
            <p className="text-gray-700 mt-1">{branchName}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-amber-600">Role</h3>
            <p className="text-gray-700 mt-1">Admin</p>
          </div>
        </div>
      </main>
    </div>
  );
}
