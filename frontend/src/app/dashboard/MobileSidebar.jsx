"use client";

import { useState } from "react";
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
  X,
} from "lucide-react";

export default function MobileSidebar({ router, handleLogout, children, is_superuser }) {
  const [open, setOpen] = useState(false);
  const isSuperUser = is_superuser === true;
  const pathname = usePathname();

  const menuItemsSuperUser = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", route: "/dashboard" },
    { icon: <Store size={20} />, label: "Restaurants", route: "/dashboard/restaurants" },
    { icon: <Building2 size={20} />, label: "Branches", route: "/dashboard/branches" },
  ];

  const menuItemsStaff = [
    { icon: <ShoppingCart size={20} />, label: "Orders", route: "/dashboard/orders" },
    { icon: <Table size={20} />, label: "Menus", route: "/dashboard/menus" },
    { icon: <Table size={20} />, label: "Tables", route: "/dashboard/table-management" },
    { icon: <Box size={20} />, label: "Units", route: "/dashboard/units" },
    { icon: <Tag size={20} />, label: "Categories", route: "/dashboard/category" },
  ];

  const menuItems = isSuperUser ? menuItemsSuperUser : menuItemsStaff;

  return (
    <div className="lg:hidden relative">
      {/* Mobile header */}
      <div className="flex justify-between items-center p-4 bg-blue-600 text-white">
        <h2 className="font-bold text-lg">Admin Panel</h2>
        <button onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-10"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-blue-600 text-white z-20 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="flex flex-col p-4 space-y-2 mt-16">
          {menuItems.map((item, idx) => {
            const isActive = pathname === item.route;
            return (
              <button
                key={idx}
                onClick={() => {
                  router.push(item.route);
                  setOpen(false); // close sidebar after click
                }}
                className={`flex items-center gap-2 w-full p-2 rounded transition-colors duration-300 ${
                  isActive ? "bg-white text-blue-600 font-semibold" : "hover:bg-blue-500"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full p-2 bg-green-500 hover:bg-green-600 rounded mt-4"
          >
            <LogOut size={20} /> Logout
          </button>
        </nav>
      </aside>

      <main className="p-4">{children}</main>
    </div>
  );
}
