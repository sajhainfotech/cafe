"use client";

import React, { useEffect, useState } from "react";
import { Bell, User } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,

} from "recharts";
import {

  Menu,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";
import AdminHeader from "./AdminHeader";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* -------- Date Helpers -------- */
const getNepalToday = () => {
  const now = new Date();
  const nepalTime = new Date(now.getTime() + (5 * 60 + 45) * 60000);
  return `${nepalTime.getMonth() + 1}/${nepalTime.getDate()}/${nepalTime.getFullYear()}`;
};

const formatDate = (dateString) => {
  const d = new Date(dateString);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

export default function AdminOrdersDashboard({ handleLogout }) {
  const { collapsed, setCollapsed } = useSidebar(); // ✅ now works
  const [orders, setOrders] = useState([]);
  const [showProfile, setShowProfile] = useState(false);

  /* -------- Fetch Orders -------- */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders`);
        const data = await res.json();
        setOrders(data || []);
      } catch (err) {
        console.error(err);
        setOrders([]);
      }
    };
    fetchOrders();
  }, []);

  /* -------- Today Stats -------- */
  const today = getNepalToday();

  const todayOrders = orders.filter(
    (o) => formatDate(o.created_at) === today
  );

  const totalOrdersToday = todayOrders.length;

  const totalItemsSold = todayOrders.reduce(
    (sum, o) =>
      sum +
      (o.items || []).reduce(
        (iSum, i) => iSum + (i.quantity || 0),
        0
      ),
    0
  );

  const todayRevenue = todayOrders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  const pendingOrders = orders.filter(
    (o) => o.status === "Pending"
  ).length;

  /* -------- Weekly Revenue -------- */
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`,
        total: 0,
      });
    }
    return days;
  };

  const weeklyData = getLast7Days().map((day) => {
    const dayOrders = orders.filter(
      (o) => formatDate(o.created_at) === day.date
    );
    return {
      day: day.label,
      total: dayOrders.reduce(
        (sum, o) => sum + (o.total_price || 0),
        0
      ),
    };
  });

  /* -------- UI -------- */
  return (
    <div className="p-0 min-h-screen">
      {/* Header */}
      <AdminHeader/>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 p-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Today Orders</p>
          <h2 className="text-3xl font-bold text-amber-600">
            {totalOrdersToday}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Items Sold</p>
          <h2 className="text-3xl font-bold text-blue-600">
            {totalItemsSold}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Today Revenue</p>
          <h2 className="text-3xl font-bold text-green-600">
            Rs. {todayRevenue.toFixed(2)}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">Pending Orders</p>
          <h2 className="text-3xl font-bold text-red-600">
            {pendingOrders}
          </h2>
        </div>
      </div>
      <div className="p-6">
        <div className="p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">
            Weekly Revenue
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#f59e0b"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
