// "use client";

// import React, { useState } from "react";
// import { usePathname } from "next/navigation";
// import {
//   LayoutDashboard,
//   Store,
//   Building2,
//   Table,
//   LogOut,
//   ShoppingCart,
//   Box,
//   Tag,
//   Menu,
//   User,
// } from "lucide-react";
// import { useSidebar } from "./SidebarContext";

// export default function DesktopSidebar({ router, handleLogout, is_superuser, children }) {
//   const { collapsed, setCollapsed, sidebarOpen, setSidebarOpen } = useSidebar();
//   const pathname = usePathname();
//   const isSuperUser = is_superuser === true;

//   const [hovered, setHovered] = useState(false);



//   const menuItemsSuperUser = [
//     { label: "Restaurants", route: "/dashboard/restaurants", icon: Store },
//     { label: "Branches", route: "/dashboard/branches", icon: Building2 },
//   ];

//   const menuItemsStaff = [
//     { label: "Dashboard", route: "/dashboard", icon: LayoutDashboard },
//     { label: "Orders", route: "/dashboard/orders", icon: ShoppingCart },
//     { label: "Menus", route: "/dashboard/menus", icon: Table },
//     { label: "Tables", route: "/dashboard/table-management", icon: Table },
//     { label: "Units", route: "/dashboard/units", icon: Box },
//     { label: "Categories", route: "/dashboard/category", icon: Tag },
//   ];

//   const menuItems = isSuperUser ? menuItemsSuperUser : menuItemsStaff;

//   const SidebarContent = () => (
//     <>
//       {menuItems.map((item, i) => {
//         const Icon = item.icon;
//         const active = pathname === item.route;

//         return (
//          <button
//   key={i}
//   onClick={() => {
//     router.push(item.route);
//     setSidebarOpen(false);
//   }}
//   className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition
//     ${active
//       ? "bg-blue-100 text-blue-700 font-semibold"
//       : "text-gray-800 hover:bg-gray-100"
//     }`}
// >
//   <Icon size={20} />
//   {/* Show label if NOT collapsed OR hovered */}
//   {(!collapsed || hovered) && <span>{item.label}</span>}
// </button>


//         );
//       })}

//       <button
//         onClick={handleLogout}
//         className="flex items-center gap-3 px-4 py-3 rounded-lg w-full bg-green-500 hover:bg-green-600 mt-6 text-white"
//       >
//         <LogOut size={20} />
//         {!collapsed && <span>Logout</span>}
//       </button>
//     </>
//   );

//   return (
//     <div className="flex min-h-screen">
//       {/* Desktop Sidebar */}
//       <aside
//         onMouseEnter={() => setHovered(true)}
//         onMouseLeave={() => setHovered(false)}
//         className={`hidden lg:flex flex-col bg-white text-gray-800 shadow-md border border-gray-200 transition-all duration-300 border-s-2
//     ${collapsed && !hovered ? "w-20" : "w-64"}`}
//       >
//         <div className="flex items-center gap-3 px-4 py-3 rounded-lg w-full transition h-16 border-gray-200">
//           <div className="p-3 rounded hover:bg-gray-100 transition-colors">
//             <User size={20} />
//           </div>
//           {/* Show label if NOT collapsed OR hovered */}
//           {(!collapsed || hovered) && <h2 className="font-bold text-lg">Admin Panel</h2>}
//         </div>

//         <nav className="flex-1 p-3 space-y-2">
//           <SidebarContent collapsed={collapsed && !hovered} />
//         </nav>
//       </aside>



//       {/* Content */}
//       <main className="flex-1">{children}</main>



      
//     </div>
//   );
// }
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
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`hidden lg:flex flex-col bg-white text-gray-800 shadow-md border border-gray-200 transition-all duration-300 border-s-2
          ${collapsed && !hovered ? "w-20" : "w-64"}`}
      >
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg w-full transition h-16 border-gray-200">
          <div className="p-3 rounded hover:bg-gray-100 transition-colors">
            <User size={20} />
          </div>
          {(!collapsed || hovered) && <h2 className="font-bold text-lg">Admin Panel</h2>}
        </div>

        <nav className="flex-1 p-3 space-y-2">
          <SidebarContent collapsed={collapsed && !hovered} />
        </nav>
      </aside>


      {/* Content */}
      <main className="flex-1 mt-14 lg:mt-0">{children}</main>
    </div>
  );
}
