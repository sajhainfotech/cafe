"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Building2,
  Table,
  LogOut,
  ShoppingCart,
  Box,
  Tag,
  Menu,
} from "lucide-react";

export default function AdminLayout({
  router,
  handleLogout,
  is_superuser,
  children,
}) {
  const pathname = usePathname();
  const isSuperUser = is_superuser === true;

  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile
  const [collapsed, setCollapsed] = useState(false); // desktop

  const menuItemsSuperUser = [
    { label: "Restaurants", route: "/dashboard/restaurants", icon: Store },
    { label: "Branches", route: "/dashboard/branches", icon: Building2 },
  ];

  const menuItemsStaff = [
    { label: "Dashboard", route: "/dashboard", icon: LayoutDashboard },
    { label: "Orders", route: "/dashboard/orders", icon: ShoppingCart },
    { label: "Menus", route: "/dashboard/menus", icon: Table },
    { label: "Tables", route: "/dashboard/table-management", icon: Table },
    { label: "Units", route: "/dashboard/units", icon: Box },
    { label: "Categories", route: "/dashboard/category", icon: Tag },
  ];

  const menuItems = isSuperUser ? menuItemsSuperUser : menuItemsStaff;

  const SidebarContent = () => (
    <>
      {menuItems.map((item, i) => {
        const Icon = item.icon;
        const active = pathname === item.route;

        return (
          <button
            key={i}
            onClick={() => {
              router.push(item.route);
              setSidebarOpen(false);
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition
              ${
                active
                  ? "bg-white text-blue-600 font-semibold"
                  : "text-white hover:bg-blue-500"
              }`}
          >
            <Icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </button>
        );
      })}

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg w-full bg-green-500 hover:bg-green-600 mt-6 text-white"
      >
        <LogOut size={20} />
        {!collapsed && <span>Logout</span>}
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-blue-600 text-white transition-all duration-300
          ${collapsed ? "w-20" : "w-64"}`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-blue-500">
          {!collapsed && <h2 className="font-bold">Admin Panel</h2>}
          <button onClick={() => setCollapsed(!collapsed)}>
            <Menu />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-2">
          <SidebarContent />
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-blue-600 text-white flex items-center justify-between px-4 z-50">
        <h2 className="font-bold">Admin Panel</h2>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu />
        </button>
      </div>

      {/* Mobile TOP SLIDE Sidebar (SAME UI) */}
      <div
        className={`lg:hidden fixed top-14 left-0 w-full bg-blue-600 z-40 transition-all duration-300
          ${sidebarOpen ? "max-h-screen py-4" : "max-h-0 overflow-hidden"}`}
      >
        <nav className="px-4 space-y-2">
          <SidebarContent />
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 p-6 pt-20 lg:pt-6">{children}</main>
    </div>
  );
}
