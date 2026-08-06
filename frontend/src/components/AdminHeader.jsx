"use client";

import { Bell, User, Menu, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useSidebar } from "../app/dashboard/SidebarContext";
import { useRouter } from "next/navigation";
import ToastProvider from "./ToastProvider";
import toast from "react-hot-toast";

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
  const lastOrderIdsRef = useRef(new Set());
  const isFirstLoad = useRef(true);
  const audioRef = useRef(null);
  const audioInitialized = useRef(false);

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.volume = 1.0;
    audioRef.current.load();

    const initAudio = () => {
      if (audioRef.current && !audioInitialized.current) {
        try {
          audioRef.current.load();
          audioRef.current.volume = 1.0;
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                audioInitialized.current = true;
              })
              .catch(() => {
                audioInitialized.current = true;
              });
          }
        } catch (err) {
          console.log("Audio init error:", err);
        }
      }
    };

    setTimeout(initAudio, 500);

    const handleInteraction = () => {
      if (!audioInitialized.current) {
        initAudio();
      }
      if (audioRef.current && audioInitialized.current) {
        audioRef.current
          .play()
          .then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          })
          .catch(() => {});
      }
    };

    document.addEventListener("click", handleInteraction);
    document.addEventListener("touchstart", handleInteraction);

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  const playSound = async () => {
    if (!audioRef.current) {
      return false;
    }

    try {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        await playPromise;
        return true;
      }
      return false;
    } catch (err) {
      console.log("Sound play error:", err.message);

      try {
        const audioCtx = new (
          window.AudioContext || window.webkitAudioContext
        )();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.value = 800;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioCtx.currentTime + 0.3,
        );

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);

        return true;
      } catch (fallbackErr) {
        console.log("Fallback also failed");
        return false;
      }
    }
  };

  const fetchNotificationData = async () => {
    const token = getCookie("adminToken");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}api/orders-list/?status=pending`, {
        headers: {
          Authorization: `Token ${token}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();
      const orders = result?.data || [];

      const currentOrderIds = new Set(
        orders
          .filter((order) => order.table_reference_id)
          .map((order) => order.table_reference_id),
      );

      setPendingCount(currentOrderIds.size);

      if (!isFirstLoad.current && currentOrderIds.size > 0) {
        let newOrderFound = false;
        let newOrderData = null;

        for (const id of currentOrderIds) {
          if (!lastOrderIdsRef.current.has(id)) {
            newOrderFound = true;
            newOrderData = orders.find((o) => o.table_reference_id === id);
            break;
          }
        }

        if (newOrderFound && newOrderData) {
          const soundPlayed = await playSound();
          const tableDisplay = newOrderData.table_number
            ? `Table ${newOrderData.table_number}`
            : "New Order";

          toast.success(`🔔 ${tableDisplay} pending!`, {
            id: "header-new-order",
            duration: 4000,
          });
        }
      }

      lastOrderIdsRef.current = currentOrderIds;

      if (isFirstLoad.current) {
        isFirstLoad.current = false;
      }
    } catch (err) {
      console.error("Header fetch error:", err);
    }
  };

  useEffect(() => {
    fetchNotificationData();
    const interval = setInterval(() => {
      fetchNotificationData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    deleteCookie("adminToken");
    deleteCookie("is_superuser");
    sessionStorage.clear();
    router.replace("/auth/login");
    setTimeout(() => {
      toast.success("You have been logged out");
    }, 1000);
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
    <>
      <div className="flex justify-between font-sans items-center lg:mb-0 p-4 md:p-3 border-b border-[#1C5721] primary-bg-color shadow-sm">
        {/* <ToastProvider /> */}
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
    </>
  );
}
