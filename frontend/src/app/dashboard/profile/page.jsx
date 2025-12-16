"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Store, Building2, ShieldCheck, Mail, Phone } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";

export default function DashboardPage() {
  const router = useRouter();

  const [adminName, setAdminName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [profile, setProfile] = useState({
    username: "-",
    first_name: "-",
    last_name: "-",
    email: "-",
    mobile_number: "-",
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/");
      return;
    }

    setAdminName(localStorage.getItem("username") || "Admin");
    setRestaurantName(localStorage.getItem("restaurant_id") || "N/A");
    setBranchName(localStorage.getItem("branch_id") || "N/A");

    setProfile({
      username: localStorage.getItem("username") || "-",
      first_name: localStorage.getItem("first_name") || "-",
      last_name: localStorage.getItem("last_name") || "-",
      email: localStorage.getItem("email") || "-",
      mobile_number: localStorage.getItem("mobile_number") || "-",
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      {/* PROFILE HERO */}
      <div className="px-4 sm:px-4 md:px-6 mt-6">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 flex items-center justify-center">
              <User size={36} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                Welcome, {adminName}
              </h1>
              <p className="text-white/90 text-sm sm:text-base mt-1">
                Admin Dashboard Overview
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* TOP CARDS */}
      <div className="px-4 sm:px-6 md:px-6 mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Restaurant */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border-l-4 border-blue-600">
            <div className="flex items-center gap-3">
              <Store className="text-blue-600" size={22} />
              <h3 className="text-lg font-semibold text-gray-800">
                Restaurant
              </h3>
            </div>
            <p className="mt-3 text-gray-600 font-medium">{restaurantName}</p>
          </div>

          {/* Branch */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border-l-4 border-green-600">
            <div className="flex items-center gap-3">
              <Building2 className="text-green-600" size={22} />
              <h3 className="text-lg font-semibold text-gray-800">Branch</h3>
            </div>
            <p className="mt-3 text-gray-600 font-medium">{branchName}</p>
          </div>

          {/* Role */}
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border-l-4 border-blue-600">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-blue-600" size={22} />
              <h3 className="text-lg font-semibold text-gray-800">Role</h3>
            </div>
            <p className="mt-3 text-gray-600 font-medium">Administrator</p>
          </div>
        </div>
      </div>

      {/* PROFILE INFORMATION CARD */}
      <div className="px-4 sm:px-6 md:px-6 mt-8">
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border-l-4 border-blue-600">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Profile Information
          </h3>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <User className="text-blue-600" size={20} />
              <span className="font-medium text-gray-700">
                Username: {profile.username}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <User className="text-blue-600" size={20} />
              <span className="font-medium text-gray-700">
                Name: {profile.first_name} {profile.last_name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="text-blue-600" size={20} />
              <span className="font-medium text-gray-700">
                Email: {profile.email}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="text-blue-600" size={20} />
              <span className="font-medium text-gray-700">
                Mobile: {profile.mobile_number}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
