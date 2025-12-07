
"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, Trash2, Printer, CheckCircle, Bell } from "lucide-react";
import Swal from "sweetalert2";
import AdminSidebar from "@/components/AdminSidebar";



  const API_URL = process.env.NEXT_PUBLIC_API_URL;


const getNepalToday = () => {
  const now = new Date();
  const nepalTime = new Date(now.getTime() + (5 * 60 + 45) * 60000);
  const m = nepalTime.getMonth() + 1;
  const d = nepalTime.getDate();
  const y = nepalTime.getFullYear();
  return `${m}/${d}/${y}`;
};

const AdminOrdersDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const prevOrdersRef = useRef([]);
  const dropdownRef = useRef(null);

 

  // Fetch tables from API
  const fetchTables = async () => {
    try {
      const res = await fetch(`${API_URL}/api/tables`);
      if (!res.ok) throw new Error("Failed to fetch tables");
      const data = await res.json();
      setTables(data);
    } catch (err) {
      console.error(err);
      setTables([]);
    }
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      const normalizedOrders = data.map((o) => ({
        order_id: o.order_id || o._id || Date.now(),
        table_id: o.table_id,
        tableName: o.tableName || "Unknown",
        items: o.items || [],
        total_price: o.total_price || 0,
        status: o.status || "Pending",
        created_at: o.created_at || new Date().toISOString(),
      }));
      setOrders(normalizedOrders);
      prevOrdersRef.current = normalizedOrders.map((o) => o.order_id);
    } catch (err) {
      console.error(err);
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchTables();
    fetchOrders();
  }, []);

  // Click outside handler for notifications
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Notification for new orders every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchOrders();
      const newOrders = orders.filter(
        (o) => !prevOrdersRef.current.includes(o.order_id)
      );
      if (newOrders.length > 0) {
        const tableNames = newOrders.map((o) => o.tableName || o.table_id).join(", ");
        showToast(`New Order at Table(s): ${tableNames}`, "info");
      }
      prevOrdersRef.current = orders.map((o) => o.order_id);
    }, 5000);

    return () => clearInterval(interval);
  }, [orders]);

  // Update pending orders count
  useEffect(() => {
    const pending = orders.filter((o) => o.status === "Pending");
    setPendingOrdersCount(pending.length);
  }, [orders]);

  const showToast = (message, icon = "success") => {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon,
      title: message,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  };

  const cancelOrder = async (order_id) => {
    const order = orders.find((o) => o.order_id === order_id);
    if (!order || order.status === "Cancelled") return;

    if (order.status === "Paid" || order.status === "Served") {
      return Swal.fire({
        icon: "info",
        title: "Cannot cancel",
        text: "Order already served/paid!",
      });
    }

    const result = await Swal.fire({
      title: "Cancel this order?",
      text: "Order will be marked as cancelled.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/api/orders/${order_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Cancelled" }),
        });
        if (!res.ok) throw new Error("Failed to cancel order");
        showToast("Order cancelled", "success");
        fetchOrders();
      } catch (err) {
        console.error(err);
        showToast("Failed to cancel order", "error");
      }
    }
  };

  const toggleStatus = async (order_id) => {
    const order = orders.find((o) => o.order_id === order_id);
    if (!order || order.status === "Cancelled") return;

    const statusFlow = ["Pending", "In Progress", "Served", "Paid"];
    const currentIndex = statusFlow.indexOf(order.status);
    const nextStatus = statusFlow[currentIndex + 1] || order.status;

    const result = await Swal.fire({
      title: "Change Order Status?",
      text: `Change status from ${order.status} to ${nextStatus}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/api/orders/${order_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
        if (!res.ok) throw new Error("Failed to update status");
        showToast("Order status updated", "success");
        fetchOrders();
      } catch (err) {
        console.error(err);
        showToast("Failed to update status", "error");
      }
    }
  };

  const deleteOrder = async (order_id) => {
    const result = await Swal.fire({
      title: "Delete Order?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/api/orders/${order_id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete order");
        showToast("Order deleted", "success");
        fetchOrders();
      } catch (err) {
        console.error(err);
        showToast("Failed to delete order", "error");
      }
    }
  };

  const printBill = (order) => {
    const myWindow = window.open("", "PRINT", "height=600,width=400");
    myWindow.document.write("<h1>Restaurant Bill</h1>");
    myWindow.document.write(`<p>Table: ${order.tableName}</p>`);
    myWindow.document.write(`<p>Time: ${order.created_at}</p><hr/>`);
    order.items.forEach((i) => {
      const price = i.price || 0;
      myWindow.document.write(`<p>${i.name} x ${i.quantity} — Rs.${price.toFixed(2)}</p>`);
    });
    myWindow.document.write(`<hr/><h3>Total: Rs.${(order.total_price || 0).toFixed(2)}</h3>`);
    myWindow.document.close();
    myWindow.focus();
    myWindow.print();
    myWindow.close();
  };

  const getStatusIndicator = (status) => {
    switch (status) {
      case "Pending":
        return <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2 inline-block"></span>;
      case "In Progress":
        return <span className="w-3 h-3 rounded-full bg-blue-500 mr-2 inline-block"></span>;
      case "Served":
        return <span className="w-3 h-3 rounded-full bg-green-500 mr-2 inline-block"></span>;
      case "Paid":
        return <span className="w-3 h-3 rounded-full bg-indigo-500 mr-2 inline-block"></span>;
      case "Cancelled":
        return <span className="w-3 h-3 rounded-full bg-red-500 mr-2 inline-block"></span>;
      default:
        return null;
    }
  };

  const formatOrderDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const getTableLocation = (tableId) => {
    const table = tables.find((t) => t.id === tableId || t._id === tableId);
    return table ? table.location || "Not set" : "Unknown";
  };

  const today = getNepalToday();
  const todayOrders = orders.filter((o) => formatOrderDate(o.created_at) === today);
  const todayTotal = todayOrders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  return (

  <div className="flex ">
  {/* Sidebar */}
  <AdminSidebar />

  {/* Main content */}
  <div className="flex-1 min-h-screen bg-gray-50 p-2 md:p-6 transition-all duration-300 md:ml-64 ">

    {/* Header */}
     <div className="flex items-center justify-between mb-4 p-1 md:p-1 bg-white shadow-sm border rounded-xl">
  {/* Header */}
  <h1 className=" text-2xl md:text-3xl font-bold text-amber-700 tracking-wide p-4 ">
    Royal Dine
  </h1>

  {/* Notification Bell */}
  <div className="relative pr-10">
    <button
      ref={dropdownRef}
      className="relative p-3 \ hover:bg-amber-100 rounded-full "
      onClick={() => setShowNotifications(!showNotifications)}
    >
      <Bell className="w-6 h-6 text-amber-700" />
      {pendingOrdersCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
          {pendingOrdersCount}
        </span>
      )}
    </button>

    {showNotifications && pendingOrdersCount > 0 && (
      <div className="absolute right-0 mt-3 w-56 bg-white shadow-xl border rounded-lg z-50">
        <p className="p-3 font-semibold border-b bg-gray-50">New Orders</p>
        {todayOrders
          .filter((o) => o.status === "Pending")
          .map((o) => (
            <p key={o.order_id} className="p-2 text-sm border-b">
              Table: {o.tableName} ({getTableLocation(o.table_id)})
            </p>
          ))}
      </div>
    )}
  </div>
</div>


    <h2 className="text-xl font-semibold mb-4">Today’s Orders {today}</h2>

    {/* Orders Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {todayOrders.map((order, idx) => (
        <div
          key={order.order_id}
          className={`relative p-5 border rounded-xl shadow-sm bg-white hover:shadow-md ${
            order.status === "Cancelled" ? "opacity-50" : ""
          }`}
        >
          {order.status !== "Cancelled" && (
            <button
              className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 rounded"
              onClick={() => cancelOrder(order.order_id)}
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-between gap-1 mb-2">
            <span className="font-semibold">Order:{idx + 1}</span>
            <span className="font-semibold text-gray-700">
              Table: {order.tableName} ({getTableLocation(order.table_id)})
            </span>
          </div>

          <p className="mb-2 text-sm text-gray-500">{order.created_at}</p>

          <ul className="ml-2 mb-2">
            {order.items.map((i) => (
              <li key={i.id || i.name}>
                {i.name} x {i.quantity} — Rs.{Number(i.price || 0).toFixed(2)}
              </li>
            ))}
          </ul>

          <p className="font-bold mt-2">Total: Rs.{(order.total_price || 0).toFixed(2)}</p>

          <div className="flex flex-wrap justify-between mt-4 gap-2 items-center">
            <div className="flex items-center gap-2">
              {getStatusIndicator(order.status)}
              <span className="text-sm font-medium">{order.status}</span>
            </div>

            <div className="flex gap-2 flex-wrap">
              {order.status !== "Cancelled" && (
                <>
                  <button
                    className="text-blue-500 hover:text-blue-600 p-1"
                    onClick={() => printBill(order)}
                  >
                    <Printer />
                  </button>
                  <button
                    className="p-1 rounded hover:scale-110 transition text-yellow-500 hover:text-yellow-600"
                    onClick={() => toggleStatus(order.order_id)}
                  >
                    <CheckCircle />
                  </button>
                </>
              )}
              <button
                className="text-red-500 hover:text-red-600 p-1 rounded"
                onClick={() => deleteOrder(order.order_id)}
              >
                <Trash2 />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Footer Total */}
    <div className="p-5 mt-8 bg-white border rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
      <span className="font-semibold text-lg text-gray-700">Today’s Total Amount</span>
      <span className="text-2xl font-extrabold text-amber-600">
        Rs. {todayTotal.toFixed(2)}
      </span>
    </div>
  </div>
</div>

  );
};

export default AdminOrdersDashboard;
