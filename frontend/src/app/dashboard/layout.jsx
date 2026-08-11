"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarProvider } from "./SidebarContext";
import DesktopSidebar from "./DesktopSidebar";
import AdminHeader from "@/components/AdminHeader";
import { getCookie } from "@/lib/cookies";

const SUPERUSER_ROUTES = ["/dashboard/restaurant", "/dashboard/branche"];
const STAFF_ROUTES = [
  "/dashboard",
  "/dashboard/order",
  "/dashboard/menu",
  "/dashboard/table-management",
  "/dashboard/unit",
  "/dashboard/category",
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSuperUser, setIsSuperUser] = useState(false);

  useEffect(() => {
    if (!pathname.startsWith("/dashboard")) return;

    if (!getCookie("adminToken")) {
      router.push("/auth/login");
      return;
    }

    const superUser = getCookie("is_superuser") === "true";
    // Cookies aren't readable during render on the client, so the role can only
    // be resolved after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSuperUser(superUser);

    if (superUser && STAFF_ROUTES.includes(pathname)) {
      router.push("/dashboard/restaurant");
    } else if (!superUser && SUPERUSER_ROUTES.includes(pathname)) {
      router.push("/dashboard");
    }
  }, [pathname, router]);

  return (
    <SidebarProvider>
      {/* h-dvh, not h-screen: h-screen is wrong on mobile browsers whose
          toolbars overlay the viewport. */}
      <div className="flex h-dvh overflow-hidden bg-surface">
        <DesktopSidebar is_superuser={isSuperUser} />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader />

          {/* The single scroll container for every dashboard page. Pages must
              not set min-h-screen or they create a second scrollbar. */}
          <main className="flex-1 overflow-y-auto scrollbar-slim">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
