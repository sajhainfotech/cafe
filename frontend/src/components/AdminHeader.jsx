"use client";

import { Bell, User, Menu } from "lucide-react";
import { useState } from "react";
import { useSidebar } from "../app/dashboard/SidebarContext";
import { useRouter } from "next/navigation";

export default function AdminHeader({
  title = "Royal Dine Dashboard",
  pendingOrders = 0,
 
}) {
   const router = useRouter();
  const { collapsed, setCollapsed } = useSidebar();
  const [showProfile, setShowProfile] = useState(false);



  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    router.push("/auth/login");
  };


  return (
    <div className="flex justify-between items-center p-6 border-b bg-white shadow-sm sticky top-0 z-40">
      {/* LEFT */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded bg-gray-100 hover:bg-gray-200"
        >
          <Menu size={24} />
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-green-600">
          {title}
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        {/* Notification */}
        <div className="relative">
          <Bell className="w-6 h-6 text-amber-700" />
          {pendingOrders > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
              {pendingOrders}
            </span>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile((prev) => !prev)}
            className="p-2 bg-amber-50 rounded-full"
          >
            <User className="w-6 h-6 text-amber-700" />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-44 bg-white border shadow-md">
              <button
                className="w-full px-4 py-3 text-left hover:bg-gray-100"
              >
                Profile
              </button>

              <button
                onClick={() => {
                  setShowProfile(false);
                  handleLogout();
                }}
                className="w-full px-4 py-3 text-left text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
