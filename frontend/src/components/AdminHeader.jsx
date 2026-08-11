"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  UserCog,
} from "lucide-react";
import toast from "react-hot-toast";

import { useSidebar } from "@/app/dashboard/SidebarContext";
import { getPageMeta } from "@/app/dashboard/navigation";
import { authHeader, deleteCookie, getAuthToken } from "@/lib/cookies";
import { useNotificationSound } from "@/lib/useNotificationSound";
import { useAccount } from "@/lib/useAccount";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const POLL_INTERVAL = 5000;

/**
 * Light header: current page title, the signed-in branch, pending-order count
 * and the account menu. Previously a dark green bar carrying three icons and no
 * indication of where you were or which branch you were in.
 */
export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { openMobile } = useSidebar();

  const [pendingCount, setPendingCount] = useState(0);
  const account = useAccount();

  const playChime = useNotificationSound();
  const knownOrderIds = useRef(new Set());
  const isFirstLoad = useRef(true);

  const { label: pageTitle, icon: PageIcon } = getPageMeta(pathname);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      if (!getAuthToken()) return;

      try {
        const res = await fetch(`${API_URL}api/orders-list/?status=pending`, {
          headers: { ...authHeader(), Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const result = await res.json();
        const orders = result?.data ?? [];
        const currentIds = new Set(
          orders
            .filter((o) => o.table_reference_id)
            .map((o) => o.table_reference_id),
        );

        if (cancelled) return;
        setPendingCount(currentIds.size);

        if (!isFirstLoad.current) {
          const newId = [...currentIds].find(
            (id) => !knownOrderIds.current.has(id),
          );
          if (newId) {
            const order = orders.find((o) => o.table_reference_id === newId);
            await playChime();
            toast.success(
              order?.table_number
                ? `New order — Table ${order.table_number}`
                : "New order received",
              { id: "header-new-order", duration: 4000 },
            );
          }
        }

        knownOrderIds.current = currentIds;
        isFirstLoad.current = false;
      } catch (err) {
        console.error("Notification poll failed:", err);
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [playChime]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-ink-200 bg-white px-3 shadow-header sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={openMobile}
          aria-label="Open menu"
          className="rounded-md p-2 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 cursor-pointer lg:hidden"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <PageIcon
            className="hidden size-4 shrink-0 text-brand-600 sm:block"
            aria-hidden="true"
          />
          <h1 className="truncate text-sm font-bold tracking-tight text-ink-900">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Branch only. The sidebar brand now shows the restaurant name, so
            repeating it here was the same string twice on one screen. */}
        {account.branch && (
          <div className="hidden max-w-48 items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-1 md:flex">
            <Building2
              className="size-3 shrink-0 text-ink-400"
              aria-hidden="true"
            />
            <span className="truncate text-2xs font-semibold text-ink-700">
              {account.branch}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push("/dashboard/order")}
          aria-label={
            pendingCount > 0
              ? `${pendingCount} pending orders — view orders`
              : "View orders"
          }
          className="relative rounded-md p-2 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900 cursor-pointer"
        >
          <Bell className="size-5" aria-hidden="true" />
          {pendingCount > 0 && (
            <span className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-full bg-danger-600 px-1 text-[10px] font-bold leading-4 text-white">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </button>

        <ProfileMenu router={router} name={account.username} />
      </div>
    </header>
  );
}

function ProfileMenu({ router, name }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = () => {
    deleteCookie("adminToken");
    deleteCookie("is_superuser");
    sessionStorage.clear();
    router.replace("/auth/login");
    toast.success("You have been logged out");
  };

  const initial = (name || "A").charAt(0).toUpperCase();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-1.5 rounded-full py-1 pl-1 pr-1.5 transition-colors cursor-pointer",
          open ? "bg-ink-100" : "hover:bg-ink-100",
        )}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 text-2xs font-bold text-white">
          {initial}
        </span>
        {name && (
          <span className="hidden max-w-24 truncate text-xs font-semibold text-ink-700 sm:block">
            {name}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-3.5 text-ink-400 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-48 overflow-hidden rounded-lg border border-ink-200 bg-white shadow-pop animate-pop-in"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              router.push("/dashboard/profile");
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-ink-700 transition-colors hover:bg-ink-50 cursor-pointer"
          >
            <UserCog className="size-4 text-ink-400" aria-hidden="true" />
            Profile
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 border-t border-ink-100 px-3 py-2.5 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50 cursor-pointer"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
