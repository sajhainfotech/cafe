"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "../../components/AdminHeader";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { useSidebar } from "./SidebarContext";

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

export default function AdminOrdersDashboard() {
  
  const { collapsed } = useSidebar();
  const [orders, setOrders] = useState([]);


  

  /* -------- Fetch Orders -------- */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders`);
        const data = await res.json();
        setOrders(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchOrders();
  }, []);

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
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`,
      };
    });
  };

  const weeklyData = getLast7Days().map((day) => {
    const dayOrders = orders.filter(
      (o) => formatDate(o.created_at) === day.date
    );
    return {
      day: day.day,
      total: dayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0),
    };
  });

  return (
    <div className="min-h-screen">
      <AdminHeader  />

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
        <Stat title="Today Orders" value={totalOrdersToday} color="text-amber-600" />
        <Stat title="Items Sold" value={totalItemsSold} color="text-blue-600" />
        <Stat title="Today Revenue" value={`Rs. ${todayRevenue.toFixed(2)}`} color="text-green-600" />
        <Stat title="Pending Orders" value={pendingOrders} color="text-red-600" />
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Weekly Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value, color }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <p className="text-gray-500">{title}</p>
      <h2 className={`text-3xl font-bold ${color}`}>{value}</h2>
    </div>
  );
}
