"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  Building2,
  Table,
  ShoppingCart,
  Box,
  Tag,
  User,
  Menu,
  LayoutDashboardIcon,
  GaugeCircle,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

export default function DesktopSidebar({ is_superuser, children }) {
  const { collapsed, setCollapsed, setSidebarOpen } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();


  const isSuperUser = is_superuser === true || is_superuser === "true";

  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const menuItemsSuperUser = [
    { label: "Restaurant", route: "/dashboard/restaurant", icon: Store },
    { label: "Branche", route: "/dashboard/branche", icon: Building2 },
    { label: "User", route: "/dashboard/all-user", icon: User },
  ];

  
  const menuItemsStaff = [
    { label: "Dashboard", route: "/dashboard", icon: GaugeCircle },
    { label: "Order", route: "/dashboard/order", icon: ShoppingCart },
    { label: "Menu", route: "/dashboard/menu", icon: Menu },
    { label: "Table", route: "/dashboard/table-management", icon: Table },
    { label: "Unit", route: "/dashboard/unit", icon: Box },
    { label: "Categorie", route: "/dashboard/category", icon: Tag },
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
              if (window.innerWidth < 992) {
                setCollapsed(true);
              }
              setSidebarOpen(false);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded border-b border-[#1C5721] w-full transition-colors
      ${
        active
          ? "bg-white text-[#236B28] font-semibold"
          : "text-[#EAF5EA] hover:bg-[#1C5721] hover:text-white"
      }`}
          >
            <Icon
              size={10}
              className={`w-4 h-4 ${
                active ? "text-[#236B28]" : "text-[#EAF5EA]"
              }`}
            />
            {(!collapsed || hovered) && (
              <span className={active ? "text-[#236B28]" : "text-[#EAF5EA]"}>
                {item.label}
              </span>
            )}
          </button>
        );
      })}
    </>
  );

  return (
    <>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`hidden lg:flex flex-col bg-[#236B28] text-[#EAF5EA]
            shadow-md border-r border-[#1C5721] transition-all duration-300
            ${collapsed && !hovered ? "w-13" : "w-50"}`}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-2 py-2 h-16">
            <div className="p-2 rounded-md bg-[#1C5721] hover:bg-[#184A1C] transition-colors">
              <LayoutDashboardIcon size={20} className="text-[#EAF5EA]" />
            </div>

            {(!collapsed || hovered) && (
              <h2 className="font-semibold text-sm tracking-wide text-[#EAF5EA]">
               
                {isSuperUser ? "Super Admin" : "Staff Panel"}
              </h2>
            )}
          </div>

          <nav className="flex-1 px-2 py-1">
            <SidebarContent />
          </nav>
        </aside>

        {/* Mobile Sidebar */}
        <div
          className={`fixed inset-0 z-40 lg:hidden transition-all ${
            collapsed ? "pointer-events-none" : ""
          }`}
        >
          {!collapsed && (
            <div
              onClick={() => setCollapsed(true)}
              className="absolute inset-0 bg-black/40"
            />
          )}

          <aside
            className={`absolute left-0 top-0 h-full w-45 bg-[#236B28] text-[#EAF5EA]
      shadow-md transform transition-transform duration-300
      ${collapsed ? "-translate-x-full" : "translate-x-0"}`}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 h-14 border-b border-[#1C5721]">
              <div className="flex items-center gap-2">
                <LayoutDashboardIcon size={18} className="text-[#EAF5EA]" />
                <h2 className="font-semibold text-sm text-[#EAF5EA]">
                   
                   {isSuperUser ? "Super Admin" : "Staff Panel"}
                </h2>
              </div>

              <button
                onClick={() => setCollapsed(true)}
                className="text-[#EAF5EA] text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <nav className="px-2 py-2">
              <SidebarContent />
            </nav>
          </aside>
        </div>

     
        <main className="flex-1 lg:mt-0">{children}</main>
      </div>
    </>
  );
}