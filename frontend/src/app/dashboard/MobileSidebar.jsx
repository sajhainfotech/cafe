"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Building2,
  Table,
  LogOut,
  UndoDotIcon,
  Cat,
  Menu,
  X,
} from "lucide-react";

export default function MobileSidebar({ router, handleLogout, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden min-h-screen bg-gray-100">
      {/* TOP BAR */}
      <div className="flex items-center justify-between bg-amber-600 text-white px-4 py-3">
        <h2 className="text-lg font-bold">Admin Panel</h2>
        <button onClick={() => setOpen(true)}>
          <Menu size={26} />
        </button>
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 z-50 w-64 h-screen bg-amber-600 text-white p-6 space-y-6 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <button onClick={() => setOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="space-y-2">
          {[
            ["Dashboard", "/dashboard", LayoutDashboard],
            ["Restaurants", "/dashboard/restaurants", Store],
            ["Branches", "/dashboard/branches", Building2],
            ["Menus", "/dashboard/menus", Table],
            ["Tables", "/dashboard/table-management", Table],
            ["Units", "/dashboard/units", UndoDotIcon],
            ["Categories", "/dashboard/category", Cat],
          ].map(([label, path, Icon]) => (
            <button
              key={path}
              className="flex items-center gap-3 p-3 rounded hover:bg-amber-700 w-full text-left"
              onClick={() => {
                router.push(path);
                setOpen(false);
              }}
            >
              <Icon size={20} /> {label}
            </button>
          ))}

          <button
            className="flex items-center gap-3 p-3 rounded bg-red-500 mt-10 hover:bg-red-600 w-full text-left"
            onClick={handleLogout}
          >
            <LogOut size={20} /> Logout
          </button>
        </nav>
      </aside>

      {/* CONTENT */}
      <main className="p-6">{children}</main>
    </div>
  );
}
