"use client";
import React, { useState } from "react";

import { Menu, X } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";

export default function DashboardLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      {/* <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} /> */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {/* <header className="flex items-center justify-between bg-white shadow px-4 py-3">
          <div className="flex items-center gap-3">
           
            <div className="md:hidden">
              <button onClick={toggleMobileSidebar} className="p-2 rounded bg-gray-200">
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
            <h1 className="text-xl font-bold text-gray-700">Dashboard</h1>
          </div>

          <div>
            <button className="px-3 py-1 bg-amber-500 rounded text-white hover:bg-amber-600">
              Logout
            </button>
          </div>
        </header> */}

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
