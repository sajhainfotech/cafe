"use client";
import React, { useEffect, useRef, useState } from "react";
import { Printer, CheckCircle } from "lucide-react";

import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const toNepalDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return new Date(d.getTime() + 5.75 * 60 * 60 * 1000);
};

const formatNepalTime = (iso) => {
  if (!iso) return "-";
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kathmandu",
  });
};

const getNepalDateString = (date) => {
  const nepal = toNepalDate(date);
  if (!nepal) return "";
  const yyyy = nepal.getFullYear();
  const mm = String(nepal.getMonth() + 1).padStart(2, "0");
  const dd = String(nepal.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeStatus = (status) => {
  if (!status) return "Pending";
  switch (status.toLowerCase()) {
    case "pending":
      return "Pending";
    case "preparing":
      return "Preparing";
    case "ready":
      return "Ready";
    case "served":
      return "Served";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
};

const backendStatus = (status) => status.toLowerCase();

const getStatusIndicator = (status) => {
  const colors = {
    Pending: "bg-yellow-300",
    Preparing: "bg-blue-300",
    Ready: "bg-indigo-300",
    Served: "bg-green-300",
    Cancelled: "bg-red-300",
  };
  return (
    <span
      className={`w-2 h-2 rounded-full inline-block mr-1 ${
        colors[status] || "bg-gray-200"
      }`}
    ></span>
  );
};

const statusOptions = ["Pending", "Preparing", "Ready", "Served"];


const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};


const AdminOrdersDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [token, setToken] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const prevOrdersCount = useRef(0);

  const audioRef = useRef(null);
  const lastOrderIdRef = useRef(null);
  const [filter, setFilter] = useState("today");
 
  const isMounted = useRef(false);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.warn(
          "Autoplay blocked: Please click anywhere on the page first."
        );
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOrders = async (authToken) => {
    try {
      const res = await fetch(`${API_URL}/api/orders-list/`, {
        headers: { Authorization: `Token ${authToken}` },
      });
      const result = await res.json();
      const ordersData = result?.data || [];

      if (ordersData.length > 0) {
        const latestOrder = ordersData[0];
        const latestId = latestOrder.reference_id;

        if (lastOrderIdRef.current && lastOrderIdRef.current !== latestId) {
          playNotificationSound();
          toast.success("New Order Received!", { icon: "🔔" });
        }

        lastOrderIdRef.current = latestId;
      }

      prevOrdersCount.current = ordersData.length;

      const normalized = ordersData.map((o) => ({
        order_id: o.reference_id,
        table_id: o.table_id,
        tableName: o.table_number ? `Table ${o.table_number}` : "Table",
        items: Array.isArray(o.items)
          ? o.items.map((i) => ({
              name: i.menu_name,
              quantity: Number(i.quantity),
              unit_name: i.unit_name || "-",
              total_price: Number(i.total_price),
            }))
          : [],
        total_price: Number(o.total_amount),
        status: normalizeStatus(o.status),
        created_at: o.order_time,
      }));

      setOrders(normalized);
    } catch (err) {
      console.error("Fetch error:", err);
      setOrders([]);
    }
  };

  const handleStatusChange = async (order_id, newStatus) => {
    const order = orders.find((o) => o.order_id === order_id);
    if (!order || order.status === "Served") return;

    try {
      const res = await fetch(`${API_URL}/api/orders/status/${order_id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: backendStatus(newStatus) }),
      });

      if (!res.ok) throw new Error("Status update failed");

      toast.success(
        newStatus === "Cancelled" ? "Order Cancelled" : "Status Updated"
      );

      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === order_id ? { ...o, status: newStatus } : o
        )
      );
      setOpenDropdown(null);
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    }
  };

  const printBill = (order) => {
    const w = window.open("", "", "width=400,height=600");
    w.document.write(`<h2>Restaurant Bill</h2>`);
    w.document.write(`<p>${order.tableName}</p>`);
    w.document.write(`<p>${formatNepalTime(order.created_at)}</p><hr/>`);

    order.items.forEach((i) => {
      w.document.write(`<p>${i.quantity}x ${i.name} - Rs.${i.total_price}</p>`);
    });

    w.document.write(`<hr/><b>Total: Rs.${order.total_price}</b>`);
    w.document.close();
    w.print();
  };

useEffect(() => {
   
    const t = getCookie("adminToken"); 
    
    if (!t) {
      
      return;
    }

    setToken(t);

    if (!isMounted.current) {
      fetchOrders(t);
      isMounted.current = true;
    } else {
      
      fetchOrders(t);
    }
    
    const interval = setInterval(() => fetchOrders(t), 5000);
    return () => clearInterval(interval);

  }, [filter]);

  const todayNepal = getNepalDateString(new Date());
  const todayOrders = orders.filter(
    (o) => getNepalDateString(o.created_at) === todayNepal
  );

  const todayTotal = todayOrders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = getNepalDateString(sevenDaysAgo);

  const filteredOrders = orders.filter((o) => {
    const orderDate = getNepalDateString(o.created_at);
    if (filter === "today") {
      return orderDate === todayNepal;
    } else {
      return orderDate >= sevenDaysAgoStr;
    }
  });

  const totalRevenue = filteredOrders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  return (
    <>
      <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-4 bg-[#ddf4e2]">
     <header className="mx-auto mb-6 flex flex-wrap items-center justify-between gap-y-4 gap-x-2">
  {/* Left Section: Dashboard & Filters */}
  <div className="flex flex-col gap-1">
    <h1 className="text-lg sm:text-xl font-bold text-[#1C5721] leading-tight">
      Kitchen Dashboard
    </h1>

    {/* Filter Buttons */}
    <div className="flex flex-wrap gap-2 mt-1">
      <button
        onClick={() => setFilter("today")}
        className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full transition-all whitespace-nowrap ${
          filter === "today"
            ? "bg-[#236B28] text-white shadow-md"
            : "bg-white text-[#236B28] border border-[#236B28]"
        }`}
      >
        Today
      </button>
      <button
        onClick={() => setFilter("weekly")}
        className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full transition-all whitespace-nowrap ${
          filter === "weekly"
            ? "bg-[#236B28] text-white shadow-md"
            : "bg-white text-[#236B28] border border-[#236B28]"
        }`}
      >
        Last 7 Days
      </button>
    </div>

    <p className="text-[11px] sm:text-sm text-[#236B28] mt-0.5">
      Displaying <span className="font-bold">{filteredOrders.length}</span> orders
    </p>
  </div>

  {/* Right Section: Revenue Card */}
  <div className="bg-white px-3 sm:px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 sm:gap-3 w-fit shrink-0">
    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-400 tracking-wider whitespace-nowrap">
      {filter === "today" ? "Today's Revenue" : "7 Days Revenue"}
    </span>

    <div className="h-4 w-[1px] bg-gray-200"></div>

    <span className="text-base sm:text-lg font-bold text-emerald-600 whitespace-nowrap">
      Rs. {totalRevenue.toFixed(2)}
    </span>
  </div>
</header>

        <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {filteredOrders.map((order, idx) => (
            <div
              key={order.order_id}
              className={`flex flex-col justify-between border rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative
            ${
              order.status === "Cancelled"
                ? "bg-red-100 border-red-300 text-red-700"
                : order.status === "Served"
                ? "bg-green-100 border-green-300 text-green-700"
                : order.status === "Ready"
                ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                : order.status === "Preparing"
                ? "bg-blue-100 border-blue-300 text-blue-700"
                : "bg-amber-100 border-amber-300 text-amber-700"
            }`}
            >
              <div className="p-3 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#236B28] text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-800">
                        {order.tableName}
                      </h3>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 font-mono">
                      {formatNepalTime(order.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-1 flex-grow">
                <div className="bg-gray-50 rounded p-3 mb-3">
                  <ul className="space-y-2">
                    {order.items.map((i, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between items-center text-[12px]"
                      >
                        <span className="text-gray-700 font-medium">
                          <span className="text-gray-400 text-[10px] mr-1">
                            {i.quantity}x
                          </span>
                          {i.name}{" "}
                          <span className="text-[10px] text-gray-400">
                            ({i.unit_name})
                          </span>
                        </span>
                        <span className="text-gray-600 font-mono text-[11px] whitespace-nowrap">
                          Rs.{i.total_price.toFixed(0)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-between items-center mt-2 px-1">
                  <span className="text-gray-500 text-[12px] font-medium">
                    Order Total
                  </span>
                  <span className="text-[15px] font-bold text-[#236B28]">
                    Rs.{order.total_price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-2 pt-2">
                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                  <div
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-semibold uppercase tracking-wide
                   ${
                     order.status === "Cancelled"
                       ? "bg-red-100 border-red-200 text-red-600"
                       : "bg-green-50 border-green-200 text-[#236B28]"
                   }`}
                  >
                    {getStatusIndicator(order.status)}
                    {order.status}
                  </div>

                  {order.status !== "Cancelled" && (
                    <div className="flex gap-2 relative">
                      <button
                        className="p-1.5 rounded-lg bg-green-50 text-[#236B28] hover:bg-[#236B28] hover:text-white transition-all shadow-sm"
                        onClick={() => printBill(order)}
                        title="Print Bill"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {["Pending", "Preparing", "Ready"].includes(
                        order.status
                      ) && (
                        <div className="relative">
                          <button
                            className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-all shadow-sm"
                            title="Change Status"
                            onClick={() =>
                              setOpenDropdown((prev) =>
                                prev === order.order_id ? null : order.order_id
                              )
                            }
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>

                          {openDropdown === order.order_id && (
                            <div
                              ref={dropdownRef}
                              className="absolute right-0 bottom-full mb-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-50 overflow-auto"
                            >
                              {[...statusOptions, "Cancelled"]
                                .filter((s) => s !== order.status)
                                .map((s) => (
                                  <div
                                    key={s}
                                    className={`px-3 py-2 text-[12px] cursor-pointer hover:bg-gray-100
                            ${
                              s === "Cancelled"
                                ? "text-red-500 font-semibold"
                                : "text-gray-700"
                            }`}
                                    onClick={() =>
                                      handleStatusChange(order.order_id, s)
                                    }
                                  >
                                    {s}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 mx-auto border-t border-[#236B28]/20 pt-6 flex flex-col md:flex-row justify-between items-center text-sm">
          <span className="text-[#236B28]/70 font-medium">End of list</span>

          <div className="flex flex-col md:flex-row gap-2 md:gap-6 items-center">
            <span className="text-[#236B28]/80 font-semibold">
              Today's Orders:{" "}
              <span className="font-black">
                {
                  orders.filter(
                    (o) => getNepalDateString(o.created_at) === todayNepal
                  ).length
                }
              </span>
            </span>

            <div className="hidden md:block h-4 w-[1px] bg-[#236B28]/20"></div>

            <span className="text-[#236B28]/80 font-semibold">
              {filter === "today"
                ? "Current View (Today): "
                : "Current View (7 Days): "}
              <span className="font-black">{filteredOrders.length}</span>
            </span>

            <div className="hidden md:block h-4 w-[1px] bg-[#236B28]/20"></div>

            <span className="text-[#236B28]/80 font-semibold">
              Total Revenue:{" "}
              <span className="font-black">Rs. {totalRevenue.toFixed(0)}</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminOrdersDashboard;
