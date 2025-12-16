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

  const SidebarContent = ({ collapsed }) => (
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
                ? "bg-blue-100 text-blue-600 font-semibold" 
                : "text-gray-700 hover:bg-gray-100"
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
    <div className="flex min-h-screen ">
      
      <aside
        className={`hidden lg:flex flex-col bg-white text-gray-800 transition-all duration-300 border-r shadow
      ${collapsed ? "w-20" : "w-64"}`}
      >
        
        <div className="flex items-center justify-between px-4 h-16 ">
          {!collapsed && (
            <h2 className="font-bold text-blue-600 text-lg">Admin Panel</h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-gray-100 transition"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        
        <nav className="flex-1 p-3 space-y-2">
          <SidebarContent collapsed={collapsed} />
        </nav>
      </aside>

      
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white text-gray-800 flex items-center justify-between px-4 ">
        <h2 className="font-bold text-blue-600">Admin Panel</h2>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded hover:bg-gray-100 transition"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed top-14 left-0 w-full bg-white z-40 border  transition-all duration-300
      ${
        sidebarOpen ? "max-h-screen py-4 shadow-md" : "max-h-0 overflow-hidden"
      }`}
      >
        <nav className="px-4 space-y-2">
          <SidebarContent collapsed={false} />
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
