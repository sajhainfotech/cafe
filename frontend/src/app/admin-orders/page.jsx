"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Trash2, Printer, CheckCircle, Bell } from "lucide-react";
import Swal from "sweetalert2";

// Get today's date in Nepal time
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

  // Load tables from localStorage
  useEffect(() => {
    const savedTables = JSON.parse(localStorage.getItem("tables")) || [];
    setTables(savedTables);
  }, []);

  // Load orders from localStorage
  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("orders")) || [];
    const normalizedOrders = savedOrders.map((o) => ({
      order_id: o.order_id || Date.now(),
      table_id: o.table_id,
      tableName: o.tableName || "Unknown",
      items: o.items || [],
      total_price: o.total_price || 0,
      status: o.status || "Pending",
      created_at: o.created_at || new Date().toISOString(),
    }));
    setOrders(normalizedOrders);
    prevOrdersRef.current = normalizedOrders.map((o) => o.order_id);
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

  // Notification for new orders
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = JSON.parse(localStorage.getItem("orders")) || [];
      const updatedOrders = saved.map((o) => ({
        order_id: o.order_id || Date.now(),
        table_id: o.table_id,
        tableName: o.tableName || "Unknown",
        items: o.items || [],
        total_price: o.total_price || 0,
        status: o.status || "Pending",
        created_at: o.created_at || new Date().toISOString(),
      }));

      const newOrders = updatedOrders.filter(
        (o) => !prevOrdersRef.current.includes(o.order_id)
      );

      if (newOrders.length > 0) {
        const tableNames = newOrders.map((o) => o.tableName || o.table_id).join(", ");
        showToast(`New Order at Table(s): ${tableNames}`, "info");
      }

      prevOrdersRef.current = updatedOrders.map((o) => o.order_id);
      setOrders(updatedOrders);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update pending orders count
  useEffect(() => {
    const pending = orders.filter((o) => o.status === "Pending");
    setPendingOrdersCount(pending.length);
  }, [orders]);

  const saveOrders = (updatedOrders) => {
    setOrders(updatedOrders);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
  };

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
      return Swal.fire({ icon: "info", title: "Cannot cancel", text: "Order already served/paid!" });
    }

    const result = await Swal.fire({
      title: "Cancel this order?",
      text: "Order will be marked as cancelled.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel",
    });

    if (result.isConfirmed) {
      const updatedOrders = orders.map((o) =>
        o.order_id === order_id ? { ...o, status: "Cancelled" } : o
      );
      saveOrders(updatedOrders);
      showToast("Order cancelled", "success");
    }
  };

  const toggleStatus = async (order_id) => {
    const order = orders.find((o) => o.order_id === order_id);
    if (!order || order.status === "Cancelled") return;

    // Status flow: Pending -> In Progress -> Served -> Paid
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
      const updatedOrders = orders.map((o) =>
        o.order_id === order_id ? { ...o, status: nextStatus } : o
      );
      saveOrders(updatedOrders);
      showToast("Order status updated", "success");
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
      const updatedOrders = orders.filter((o) => o.order_id !== order_id);
      saveOrders(updatedOrders);
      showToast("Order deleted", "success");
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
    const table = tables.find((t) => t.id === tableId);
    return table ? table.location || "Not set" : "Unknown";
  };

  const today = getNepalToday();
  const todayOrders = orders.filter(
    (o) => formatOrderDate(o.created_at) === today
  );
  const todayTotal = todayOrders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 p-5 rounded-xl bg-white shadow-sm border">
        <h1 className="text-3xl font-bold text-amber-700 tracking-wide">Royal Dine Dashboard</h1>
        <div className="relative">
          <button
            ref={dropdownRef}
            className="relative p-3 bg-amber-50 hover:bg-amber-100 rounded-full shadow-sm"
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

      <h1 className="text-xl font-semibold mb-4">Today’s Orders {today}</h1>

      {/* Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {todayOrders.map((order, idx) => (
          <div
            key={order.order_id}
            className={`relative p-5 border rounded-xl shadow-sm bg-white hover:shadow-md transition ${
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

            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">Order:{idx + 1}</span>
              <span className="font-semibold text-gray-700">
                Table: {order.tableName} ({getTableLocation(order.table_id)})
              </span>
            </div>

            <p className="mb-2 text-sm text-gray-500">{order.created_at}</p>

            <ul className="ml-2 mb-2">
              {order.items.map((i) => (
                <li key={i.id || i.name}>
                  {i.name} x {i.quantity} — Rs.{(i.price || 0).toFixed(2)}
                </li>
              ))}
            </ul>

            <p className="font-bold mt-2">Total: Rs.{(order.total_price || 0).toFixed(2)}</p>

            <div className="flex justify-between mt-4 items-center">
              <div className="flex items-center">
                {getStatusIndicator(order.status)}
                <span className="text-sm font-medium">{order.status}</span>
              </div>

              <div className="flex gap-4">
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
      <div className="p-5 mt-8 bg-white border rounded-xl shadow-sm flex justify-between items-center">
        <span className="font-semibold text-lg text-gray-700">Today’s Total Amount</span>
        <span className="text-2xl font-extrabold text-amber-600">Rs. {todayTotal.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default AdminOrdersDashboard;
