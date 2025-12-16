"use client";

import { useRouter, usePathname } from "next/navigation";
import DesktopSidebar from "./DesktopSidebar";

import { useEffect, useState } from "react";
import { SidebarProvider } from "./SidebarContext";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSuperUser, setIsSuperUser] = useState(false);

  useEffect(() => {
    const superUserFlag = localStorage.getItem("is_superuser") === "true";
    const token = localStorage.getItem("adminToken");

    if (!token) {
      router.push("/auth/login");
      return;
    }

    setIsSuperUser(superUserFlag);

    
    const superUserRoutes = [ "/dashboard/restaurants", "/dashboard/branches"];
    const staffRoutes = [
      "/dashboard/orders",
      "/dashboard/menus",
      "/dashboard/table-management",
      "/dashboard/units",
      "/dashboard/category",
    ];

    if (superUserFlag && staffRoutes.includes(pathname)) {
      
      router.push("/dashboard/restaurants"); 
    } else if (!superUserFlag && superUserRoutes.includes(pathname)) {
    
      router.push("/dashboard/orders");
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/auth/login");
  };

  return (
    <>
     <SidebarProvider>
      <DesktopSidebar
        router={router}
        handleLogout={handleLogout}
        is_superuser={isSuperUser}
      >
        {children}
      </DesktopSidebar>
    </SidebarProvider>
    </>
  );
}
