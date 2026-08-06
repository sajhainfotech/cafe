"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import {
  Package,
  Tag,
  DollarSign,
  Clock,
  TrendingUp,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const POLL_INTERVAL = 30000;

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [username, setUsername] = useState("");
  const isFetched = useRef(false);
  const [nepalTime, setNepalTime] = useState(new Date());
  const intervalRef = useRef(null);

  const getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const getNepalTime = () => {
    const nowUTC = new Date(new Date().toUTCString().slice(0, -4));
    return new Date(nowUTC.getTime() + 5.75 * 60 * 60 * 1000);
  };

  useEffect(() => {
    const interval = setInterval(() => setNepalTime(getNepalTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = nepalTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatTime = (date) => {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const fetchStats = async (authToken) => {
    try {
      const res = await fetch(`${API_URL}api/dashboard-stats/`, {
        headers: { Authorization: `Token ${authToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch stats");

      const result = await res.json();

      if (result.response_code === "0") {
        setStats(result.data);
      } else {
        console.warn(
          "Stats API returned error:",
          result.response,
          result.errors,
        );
      }
    } catch (err) {
      console.error("Stats Fetch Error:", err);
    }
  };

  const refreshData = async () => {
    const authToken = getCookie("adminToken");
    if (!authToken) return;
    await fetchStats(authToken);
  };

  useEffect(() => {
    const storedToken = getCookie("adminToken");

    if (!storedToken) {
      router.replace("/auth/login");
      return;
    }

    if (!isFetched.current) {
      refreshData();
      isFetched.current = true;
    }

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(refreshData, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router]);

  useEffect(() => {
    const storedUserInfo = sessionStorage.getItem("user_info");
    if (storedUserInfo) {
      try {
        const userData = JSON.parse(storedUserInfo);
        setUsername(userData.first_name || userData.username || "Admin");
      } catch (e) {
        console.error("Error parsing user info");
      }
    }
  }, []);

  const today = {
    orders: stats?.today_orders ?? 0,
    items: stats?.today_items_sold ?? 0,
    revenue: stats?.today_revenue ?? 0,
    pending: stats?.today_pending_orders ?? 0,
  };

  const lifetime = {
    orders: stats?.total_orders ?? 0,
    revenue: stats?.total_revenue ?? 0,
    items: stats?.total_items_sold ?? 0,
  };

  const weeklyData = stats?.weekly ?? [];

  return (
    <div className="min-h-screen font-sans antialiased text-slate-900 p-4 secondary-bg-color">
      <div className="max-w-8xl mx-auto mb-3 flex justify-between items-center rounded from-[#EAF5EA] via-[#DFF0E0] to-[#CFE8D2]">
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold bg-linear-to-r from-[#236B28] to-[#1F7A34] bg-clip-text text-transparent">
            {getGreeting()}, {username}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right mr-2">
            <span className="text-sm font-bold text-[#236B28]/80">
              {formatTime(nepalTime)}
            </span>
          </div>

          <div className="bg-[#EAF5EA] px-3 py-1 rounded border border-[#236B28]/20 flex items-center gap-1 text-[11px] font-bold text-[#236B28] shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#236B28]/60 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#236B28]"></span>
            </span>
            Live Update
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#236B28]/70 mb-3 flex items-center gap-2">
          <span className="h-px w-8 bg-[#236B28]/30"></span>
          Today's Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: "Today's Orders",
              value: today.orders,
              icon: <Package className="w-6 h-6 text-[#236B28]" />,
            },
            {
              title: "Today's Items Sold",
              value: today.items,
              icon: <Tag className="w-6 h-6 text-[#236B28]" />,
            },
            {
              title: "Today's Revenue",
              value: `Rs. ${today.revenue.toLocaleString()}`,
              icon: <Wallet className="w-6 h-6 text-[#236B28]" />,
              // icon: <DollarSign className="w-6 h-6 text-[#236B28]" />,
            },
            {
              title: "Today's Pending Orders",
              value: today.pending,
              icon: <Clock className="w-6 h-6 text-[#236B28]" />,
            },
          ].map((stat) => (
            <div
              key={stat.title}
              className="relative bg-linear-to-br from-[#F1F8F2] via-white to-[#EAF5EA] px-5 py-4 rounded-xl border border-[#D5E8D8] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#236B28]/10 rounded-full blur-2xl" />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1C5721]">
                  {stat.title}
                </p>
                <div className="p-2 rounded-lg bg-[#EAF5EA]">{stat.icon}</div>
              </div>
              <p className="text-xl font-bold text-[#1C5721] relative z-10">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#236B28]/70 mb-3 flex items-center gap-2">
          <span className="h-px w-8 bg-[#236B28]/30"></span>
          Lifetime Totals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              title: "Total Orders",
              value: lifetime.orders,
              icon: <ShoppingBag className="w-6 h-6 text-[#236B28]" />,
            },
            {
              title: "Total Revenue",
              value: `Rs. ${lifetime.revenue.toLocaleString()}`,
              icon: <Wallet className="w-6 h-6 text-[#236B28]" />,
            },
            {
              title: "Total Items Sold",
              value: lifetime.items,
              icon: <TrendingUp className="w-6 h-6 text-[#236B28]" />,
            },
          ].map((stat) => (
            <div
              key={stat.title}
              className="relative bg-linear-to-br from-[#F8FBF8] via-white to-[#F1F8F2] px-5 py-4 rounded-xl border border-[#D5E8D8]/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#236B28]/5 rounded-full blur-2xl" />
              <div className="flex items-center justify-between mb-2 relative z-10">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#1C5721]/80">
                  {stat.title}
                </p>
                <div className="p-2 rounded-lg bg-[#EAF5EA]/60">
                  {stat.icon}
                </div>
              </div>
              <p className="text-xl font-bold text-[#1C5721]/90 relative z-10">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mx-auto">
        <div className="bg-[#F1F8F2] p-4 rounded-xl shadow-sm border border-[#D5E8D8] relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#1C5721] tracking-tight">
                Revenue Stream
              </h2>
              <p className="text-[#236B28] text-sm">Weekly growth trajectory</p>
            </div>
            <div className="bg-[#EAF5EA] p-1 rounded flex border border-[#D5E8D8]">
              <div className="px-2 bg-[#236B28]/10 rounded text-[10px] font-bold text-[#1C5721] uppercase italic">
                Revenue
              </div>
              <div className="px-3 py-1 text-[10px] font-bold text-[#236B28] uppercase italic">
                Units
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={weeklyData}
                margin={{ top: 0, right: 10, left: -20, bottom: 2 }}
              >
                <defs>
                  <linearGradient
                    id="lineGradGreen"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#236B28" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#236B28" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="5 5"
                  vertical={false}
                  stroke="#D5E8D8"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#1C5721", fontSize: 12 }}
                  dy={15}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#1C5721", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#236B28", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#F1F8F2",
                    borderRadius: "12px",
                    border: "1px solid #D5E8D8",
                    color: "#1C5721",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#236B28"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                  fill="url(#lineGradGreen)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="itemsSold"
                  stroke="#4CAF50"
                  strokeWidth={3}
                  strokeDasharray="6 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#F1F8F2] p-4 rounded-xl shadow-sm border border-[#D5E8D8] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#236B28]/10 blur-[60px] rounded-full" />
          <div className="relative z-10">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[#1C5721] tracking-tight">
                Order Intensity
              </h2>
              <p className="text-[#236B28] text-sm font-medium">
                Daily transaction volume
              </p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 0, right: 0, left: -20, bottom: 2 }}
                >
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#1C5721", fontSize: 12, fontWeight: 600 }}
                    dy={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#236B28", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(35,107,40,0.08)" }}
                    contentStyle={{
                      backgroundColor: "#F1F8F2",
                      borderRadius: "12px",
                      border: "1px solid #D5E8D8",
                      color: "#1C5721",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar
                    dataKey="ordersCount"
                    fill="#236B28"
                    radius={[8, 8, 0, 0]}
                    barSize={26}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
