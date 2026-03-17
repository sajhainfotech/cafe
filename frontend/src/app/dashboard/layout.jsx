// 1st code

// DashboardLayout.js

"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import DesktopSidebar from "./DesktopSidebar";
import AdminHeader from "@/components/AdminHeader";
import ToastProvider from "@/components/ToastProvider";

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

// कुकी हटाउनका लागि हेल्पर
const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSuperUser, setIsSuperUser] = useState(false);

  useEffect(() => {
    const superUserFlag = getCookie("is_superuser") === "true";
    const token = getCookie("adminToken");

    if (!token) {
      router.push("/auth/login");
      return;
    }

    setIsSuperUser(superUserFlag);

    const superUserRoutes = ["/dashboard/restaurant", "/dashboard/branche"];
    const staffRoutes = [
      "/dashboard",
      "/dashboard/order",
      "/dashboard/menu",
      "/dashboard/table-management",
      "/dashboard/unit",
      "/dashboard/category",
    ];

    if (superUserFlag && staffRoutes.includes(pathname)) {
      router.push("/dashboard/restaurant");
    } else if (!superUserFlag && superUserRoutes.includes(pathname)) {
      router.push("/dashboard");
    }
  }, [pathname, router]);

  const handleLogout = () => {
    deleteCookie("adminToken");
    deleteCookie("is_superuser");
    router.push("/auth/login");
  };

  return (
    <SidebarProvider>
      <DashboardContainer isSuperUser={isSuperUser} handleLogout={handleLogout}>
        <ToastProvider position="top-right" reverseOrder={false} />
        {children}
      </DashboardContainer>
    </SidebarProvider>
  );
}

function DashboardContainer({ children, isSuperUser, handleLogout }) {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      <DesktopSidebar is_superuser={isSuperUser} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          title="Restaurant Management"
          toggleMobileSidebar={() => setCollapsed(!collapsed)}
        />

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

// 2nd code
// "use client";

// import { useRouter, usePathname } from "next/navigation";
// import { useEffect, useState } from "react";
// import { SidebarProvider, useSidebar } from "./SidebarContext";
// import DesktopSidebar from "./DesktopSidebar";
// import AdminHeader from "@/components/AdminHeader";
// import ToastProvider from "@/components/ToastProvider";

// const getCookie = (name) => {
//   if (typeof document === "undefined") return null;
//   const value = `; ${document.cookie}`;
//   const parts = value.split(`; ${name}=`);
//   if (parts.length === 2) return parts.pop().split(";").shift();
//   return null;
// };

// const deleteCookie = (name) => {
//   document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
// };

// export default function DashboardLayout({ children }) {
//   const router = useRouter();
//   const pathname = usePathname();
//   const [isSuperUser, setIsSuperUser] = useState(false);

//   useEffect(() => {
//     // 1. Skip auth for public pages like /menu
//     const publicRoutes = ["/menu"];
//     if (publicRoutes.some((route) => pathname.startsWith(route))) return;

//     // 2. Check admin login
//     const token = getCookie("adminToken");
//     const superUserFlag = getCookie("is_superuser") === "true";

//     if (!token) {
//       router.push("/auth/login");
//       return;
//     }

//     setIsSuperUser(superUserFlag);

//     // 3. Optional redirect based on role
//     const superUserRoutes = ["/dashboard/restaurant", "/dashboard/branche"];
//     const staffRoutes = [
//       "/dashboard",
//       "/dashboard/order",
//       "/dashboard/menu",
//       "/dashboard/table-management",
//       "/dashboard/unit",
//       "/dashboard/category",
//     ];

//     if (superUserFlag && staffRoutes.includes(pathname)) {
//       router.push("/dashboard/restaurant");
//     } else if (!superUserFlag && superUserRoutes.includes(pathname)) {
//       router.push("/dashboard");
//     }
//   }, [pathname, router]);

//   const handleLogout = () => {
//     deleteCookie("adminToken");
//     deleteCookie("is_superuser");
//     router.push("/auth/login");
//   };

//   return (
//     <SidebarProvider>
//       <DashboardContainer isSuperUser={isSuperUser} handleLogout={handleLogout}>
//         <ToastProvider position="top-right" reverseOrder={false} />
//         {children}
//       </DashboardContainer>
//     </SidebarProvider>
//   );
// }

// function DashboardContainer({ children, isSuperUser, handleLogout }) {
//   const { collapsed, setCollapsed } = useSidebar();

//   return (
//     <div className="flex h-screen overflow-hidden">
//       <DesktopSidebar is_superuser={isSuperUser} />

//       <div className="flex-1 flex flex-col overflow-hidden">
//         <AdminHeader
//           title="Restaurant Management"
//           toggleMobileSidebar={() => setCollapsed(!collapsed)}
//         />

//         <main className="flex-1 overflow-y-auto">{children}</main>
//       </div>
//     </div>
//   );
// }

// 3rd code (new code 3-17-2026)
