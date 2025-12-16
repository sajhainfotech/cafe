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
  User,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

export default function DesktopSidebar({ router, handleLogout, is_superuser, children }) {
  const { collapsed, setCollapsed, sidebarOpen, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const isSuperUser = is_superuser === true;

  const [hovered, setHovered] = useState(false);

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

              // ✅ mobile only (< 992px) auto close
              if (window.innerWidth < 992) {
                setCollapsed(true);
              }

              // desktop logic (safe to keep)
              setSidebarOpen(false);
            }}

            className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition
              ${active
                ? "bg-blue-100 text-blue-700 font-semibold"
                : "text-gray-800 hover:bg-gray-100"
              }`}
          >
            <Icon size={20} />
            {(!collapsed || hovered) && <span>{item.label}</span>}
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
    <>

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`hidden lg:flex flex-col bg-white text-gray-800 shadow-md border border-gray-200 transition-all duration-300
           ${collapsed && !hovered ? "w-20" : "w-64"}`}
        >
          <div className="flex items-center gap-3 px-4 py-3 h-16">
            <div className="p-3 rounded hover:bg-gray-100">
              <User size={20} />
            </div>
            {(!collapsed || hovered) && (
              <h2 className="font-bold text-lg">Admin Panel</h2>
            )}
          </div>

          <nav className="flex-1 p-3 space-y-2">
            <SidebarContent collapsed={collapsed && !hovered} />
          </nav>
        </aside>


        {/* Mobile Sidebar */}
        <div
          className={`fixed inset-0 z-40 lg:hidden transition-all ${collapsed ? "pointer-events-none" : ""
            }`}
        >
          {/* Backdrop */}
          {!collapsed && (
            <div
              onClick={() => setCollapsed(true)}
              className="absolute inset-0 bg-black/40"
            />
          )}

          {/* Sidebar */}
          <aside
            className={`absolute left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300
    ${collapsed ? "-translate-x-full" : "translate-x-0"}`}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 h-16">
              <div className="flex items-center gap-3">
                <User size={20} />
                <h2 className="font-bold text-lg">Admin Panel</h2>
              </div>

              {/* Close button – mobile only */}
              <button
                onClick={() => setCollapsed(true)}
                className="lg:hidden text-xl font-bold"
              >
                ✕
              </button>
            </div>


            <nav className="p-3 space-y-2">
              <SidebarContent collapsed={false} />
            </nav>
          </aside>
        </div>




        {/* Content */}
        <main className="flex-1 lg:mt-0">{children}</main>
      </div>

    </>
  );
}
