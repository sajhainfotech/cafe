"use client";

import { Bell, User, Menu } from "lucide-react";
import { useState } from "react";
import { useSidebar } from "./SidebarContext";

export default function AdminHeader({
  title = "Royal Dine Dashboard",
  pendingOrders = 0,
  handleLogout,
}) {
  const { collapsed, setCollapsed } = useSidebar();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center gap-4 lg:mb-6 p-4 md:p-6 border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Sidebar Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Toggle Sidebar"
          >
            <Menu size={24} className="text-gray-700" />
          </button>

          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-green-500">
            {title}
          </h1>

        </div>

        <div className="flex items-center gap-3 md:gap-4">
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
              className="p-2 bg-amber-50 rounded-full"
              onClick={() => setShowProfile(!showProfile)}
            >
              <User className="w-6 h-6 text-amber-700" />
            </button>

            {showProfile && (
              <div className="absolute right-0 md:right-0 mt-3 w-40 bg-white border shadow rounded-lg z-50">
                <button className="w-full p-3 hover:bg-gray-100">
                  Profile
                </button>
                <button

                  className="w-full p-3 text-red-500 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  );
}
