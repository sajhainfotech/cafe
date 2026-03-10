"use client";

import { Bell, User, Menu, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSidebar } from "../app/dashboard/SidebarContext";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export default function AdminHeader() {
  const router = useRouter();
  const { collapsed, setCollapsed } = useSidebar();
  const [showProfile, setShowProfile] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const dropdownRef = useRef(null);
  const lastOrderIdRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = new Audio("/notification.mp3");
    audio.load();
    audioRef.current = audio;
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .catch(() => console.log("Click page to enable sound"));
    }
  };

  const fetchNotificationData = async () => {
    const token = getCookie("adminToken");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/orders-list/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const result = await res.json();
      const orders = result?.data || [];

      const pendingOrders = orders.filter(
        (o) => o.status?.toLowerCase() === "pending",
      );
      setPendingCount(pendingOrders.length);

      if (orders.length > 0) {
        const latestId = orders[0].reference_id;

        if (lastOrderIdRef.current === null) {
          lastOrderIdRef.current = latestId;
          return;
        }

        if (lastOrderIdRef.current !== latestId) {
          console.log("New order detected!");
          playSound();
          lastOrderIdRef.current = latestId;
        }
      }
    } catch (err) {
      console.error("Header fetch error:", err);
    }
  };

  useEffect(() => {
    fetchNotificationData();
    const interval = setInterval(() => {
      fetchNotificationData;
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    deleteCookie("adminToken");
    deleteCookie("is_superuser");
    router.push("/auth/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex justify-between font-sans items-center lg:mb-0 p-4 md:p-3 border-b border-[#1C5721] bg-[#236B28] shadow-sm">
      <div className="flex items-center gap-3 md:gap-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded bg-[#1C5721] hover:bg-[#184A1C] transition-colors cursor-pointer"
          title="Toggle Sidebar"
        >
          <Menu size={24} className="text-[#EAF5EA]" />
        </button>
      </div>

      <div className="flex items-center gap-3 md:gap-5 pr-5">
        <div
          className="relative cursor-pointer"
          onClick={() => router.push("/dashboard/order")}
        >
          <Bell className="w-5 h-5 text-[#EAF5EA]" />
          {pendingCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full animate-bounce">
              {pendingCount}
            </span>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            className="p-2 rounded-full cursor-pointer bg-[#1C5721] hover:bg-[#184A1C] transition-colors"
            onClick={() => setShowProfile(!showProfile)}
          >
            <User className="w-5 h-5 text-[#EAF5EA]" />
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-3 w-32 bg-white border border-gray-200 shadow-lg rounded-lg z-50 overflow-hidden">
              <button
                onClick={() => router.push("/dashboard/profile")}
                className="w-full flex items-center gap-2 p-3 hover:bg-gray-100 text-sm text-gray-700 cursor-pointer"
              >
                <User size={16} /> Profile
              </button>
              <button
                className="w-full flex items-center gap-2 p-3 hover:bg-gray-100 text-red-600 text-sm border-t border-gray-100 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
