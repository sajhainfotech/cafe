"use client";

import {
  LayoutDashboard,
  Store,
  Building2,
  Table,
  LogOut,
  UndoDotIcon,
  Cat,
} from "lucide-react";

export default function DesktopSidebar({ router, handleLogout, children }) {
  return (
    <div className="hidden lg:flex min-h-screen bg-gray-100">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-amber-600 text-white p-6 space-y-6 h-screen">
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
            onClick={() => router.push("/dashboard/menus")}
          >
            <Table size={20} /> Menus
          </button>

          <button
            className="flex items-center gap-3 p-3 rounded hover:bg-amber-700 w-full text-left"
            onClick={() => router.push("/dashboard/table-management")}
          >
            <Table size={20} /> Tables
          </button>

          <button
            className="flex items-center gap-3 p-3 rounded hover:bg-amber-700 w-full text-left"
            onClick={() => router.push("/dashboard/units")}
          >
            <UndoDotIcon size={20} /> Units
          </button>

          <button
            className="flex items-center gap-3 p-3 rounded hover:bg-amber-700 w-full text-left"
            onClick={() => router.push("/dashboard/category")}
          >
            <Cat size={20} /> Categories
          </button>

          <button
            className="flex items-center gap-3 p-3 rounded bg-red-500 mt-10 hover:bg-red-600 w-full text-left"
            onClick={handleLogout}
          >
            <LogOut size={20} /> Logout
          </button>
        </nav>
      </aside>

      {/* RIGHT CONTENT */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
