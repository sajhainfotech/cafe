"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    setRestaurantName(localStorage.getItem("restaurant_id") || "N/A");
    setBranchName(localStorage.getItem("branch_id") || "N/A");
  }, []);

  return (
    <>
      <h1 className="text-3xl font-bold text-amber-700">Dashboard</h1>
      <p className="text-gray-600 mt-2">
        Welcome, <strong>{adminName}</strong>
      </p>

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
    </>
  );
}