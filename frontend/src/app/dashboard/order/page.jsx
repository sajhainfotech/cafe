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
    case "paid":
      return "Paid";
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
        colors[status] || "bg-gray-400"
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
  const [filter, setFilter] = useState("today");
  const [newStatus, setNewStatus] = useState("pending");

  const dropdownRef = useRef(null);
  const audioRef = useRef(null);
  const previousOrderIds = useRef(new Set());
  const isFirstLoad = useRef(true);
  const audioInitialized = useRef(false);
  const [restaurant, setRestaurant] = useState([]);
  const [branch, setBranch] = useState([]);

  const restaurentData = sessionStorage.getItem("restaurant_name");
  const branchData = sessionStorage.getItem("branch_name");

  useEffect(() => {
    setBranch(branchData);
    setRestaurant(restaurentData);
  }, []);

  useEffect(() => {
    const initAudio = async () => {
      if (audioRef.current && !audioInitialized.current) {
        try {
          audioRef.current.load();
          await audioRef.current.play();
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioInitialized.current = true;
        } catch (err) {
          audioInitialized.current = true;
        }
      }
      document.removeEventListener("click", initAudio);
      document.removeEventListener("touchstart", initAudio);
    };

    document.addEventListener("click", initAudio);
    document.addEventListener("touchstart", initAudio);

    return () => {
      document.removeEventListener("click", initAudio);
      document.removeEventListener("touchstart", initAudio);
    };
  }, []);

  const playNotificationSound = async () => {
    if (!audioRef.current) {
      console.warn("❌ Audio element not available");
      return false;
    }

    try {
      audioRef.current.currentTime = 0;
      await new Promise((resolve) => setTimeout(resolve, 50));
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
        return true;
      }
      return false;
    } catch (err) {
      console.error("❌ Audio playback error:", err.message);
      if (err.name === "NotAllowedError") {
        toast.error("🔊 Click here to enable sound", {
          duration: 5000,
          onClick: async () => {
            try {
              await audioRef.current.play();
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              audioInitialized.current = true;
              toast.success("🔊 Sound enabled!");
            } catch (e) {
              console.error("Manual play failed:", e);
            }
          },
        });
      }
      return false;
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

  const fetchOrders = async (authToken, showNewOrderNotification = true) => {
    try {
      const res = await fetch(
        `${API_URL}api/orders-list/?status=${newStatus}`,
        {
          headers: {
            Authorization: `Token ${authToken}`,
            Accept: "application/json",
          },
        },
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch orders: ${res.status}`);
      }

      const result = await res.json();
      const ordersData = result?.data || [];

      const currentOrderIds = new Set(
        ordersData
          .filter((order) => order.table_reference_id)
          .map((order) => order.table_reference_id),
      );

      let hasNewOrder = false;
      let newOrderData = null;

      if (
        showNewOrderNotification &&
        !isFirstLoad.current &&
        currentOrderIds.size > 0
      ) {
        for (const id of currentOrderIds) {
          if (!previousOrderIds.current.has(id)) {
            console.log("🆕 NEW order detected for table:", id);
            hasNewOrder = true;
            newOrderData = ordersData.find(
              (order) => order.table_reference_id === id,
            );
            break;
          }
        }
      }

      previousOrderIds.current = currentOrderIds;

      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        console.log("📋 First load complete");
      }

      if (hasNewOrder && newOrderData) {
        console.log("🔊 Playing notification sound...");
        const soundPlayed = await playNotificationSound();
        const tableDisplay = newOrderData.table_number
          ? `Table ${newOrderData.table_number}`
          : "Takeout / Unassigned";

        toast.success(`🆕 New Order at ${tableDisplay}!`, {
          icon: "🔔",
          id: "new-order-notification",
          duration: 5000,
        });

        if (!soundPlayed) {
          console.warn("⚠️ Sound didn't play, but toast shown");
        }
      }

      const normalized = Array.isArray(ordersData)
        ? ordersData.map((o) => ({
            table_reference_id: o.table_reference_id,
            table_number: o.table_number,
            tableName: o.table_number
              ? `Table ${o.table_number}`
              : "Takeout / Unassigned",
            items: Array.isArray(o.items)
              ? o.items.map((i) => ({
                  name: i.menu_name,
                  quantity: Number(i.total_quantity),
                  unit_name: "-",
                  total_price: Number(i.total_price),
                }))
              : [],
            total_price: Number(o.grand_total),
            status: normalizeStatus(o.status), // uses the updated function
            created_at: o.order_time || new Date().toISOString(),
          }))
        : [];

      setOrders(normalized);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setOrders([]);
    }
  };

  const handleStatusChange = async (tableReferenceId, selectedStatus) => {
    try {
      const response = await fetch(
        `${API_URL}api/orders/${tableReferenceId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            status: backendStatus(selectedStatus),
          }),
        },
      );

      const responseText = await response.text();
      let result = null;

      try {
        result = JSON.parse(responseText);
      } catch (error) {
        console.error("JSON parse error:", error);
      }

      if (!response.ok) {
        const errorMessage =
          result?.message ||
          result?.error ||
          result?.detail ||
          `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      toast.success(
        selectedStatus === "Cancelled"
          ? "Order cancelled successfully."
          : "Order status updated successfully.",
        {
          id: "order-status-update",
        },
      );

      setOpenDropdown(null);
      await fetchOrders(token, false);
    } catch (error) {
      console.error("❌ PATCH Error:", error);
      toast.error(error.message || "Unable to update order status.", {
        id: "order-status-error",
      });
    }
  };

  const printBillContent = (order) => {
    const w = window.open("", "", "width=360,height=600");

    const formatMoney = (amount) => Math.round(Number(amount));

    const getNepalTimeString = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kathmandu",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const date = {};
      parts.forEach(({ type, value }) => {
        date[type] = value;
      });
      return `${date.day}.${date.month}.${date.year}/${date.hour}:${date.minute}:${date.second}`;
    };

    w.document.write(`
  <html>
    <head>
      <title>Bill</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          background: #f4f4f4;
          display: flex;
          justify-content: center;
          padding: 12px 6px;
        }
        .receipt {
          max-width: 280px;
          width: 100%;
          background: white;
          padding: 10px 10px 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border-radius: 2px;
        }
        .store-name {
          font-size: 14px;
          font-weight: 700;
          text-align: center;
          letter-spacing: 0.5px;
          color: #1e293b;
          padding-bottom: 2px;
          border-bottom: 1px dashed #aaa;
          margin-bottom: 4px;
        }
        .store-name span { color: #0f7b3a; }
        .tagline {
          text-align: center;
          font-size: 7px;
          text-transform: uppercase;
          color: #888;
          letter-spacing: 0.5px;
          margin-top: -1px;
          margin-bottom: 6px;
        }
        .meta {
          display: flex;
          justify-content: space-between;
          font-size: 8px;
          padding: 2px 0;
          border-bottom: 1px dotted #ccc;
          margin-bottom: 4px;
        }
        .meta .label { color: #666; }
        .meta .value { font-weight: 600; color: #222; }
        .items-head {
          display: flex;
          justify-content: space-between;
          font-size: 7px;
          text-transform: uppercase;
          color: #999;
          letter-spacing: 0.3px;
          padding: 2px 0;
          border-bottom: 1px solid #eee;
        }
        .items-head .head-item { flex: 1; }
        .items-head .head-qty { width: 28px; text-align: center; }
        .items-head .head-price { width: 60px; text-align: right; }
        .item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 2px 0;
          font-size: 9px;
          border-bottom: 1px dotted #f0f0f0;
        }
        .item:last-of-type { border-bottom: none; }
        .item-name {
          flex: 1;
          font-weight: 500;
          color: #222;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-name small {
          font-weight: 400;
          color: #999;
          font-size: 7px;
          margin-left: 2px;
        }
        .item-qty { width: 28px; text-align: center; font-weight: 600; color: #333; }
        .item-price { width: 60px; text-align: right; font-weight: 600; color: #1e293b; }
        .divider { border: none; border-top: 1px dashed #ccc; margin: 4px 0; }
        .total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 0 0;
          border-top: 2px solid #222;
          margin-top: 2px;
        }
        .total-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #222;
        }
        .total-amount { font-size: 12px; font-weight: 700; color: #222; }
        .footer {
          text-align: center;
          font-size: 8px;
          color: #666;
          padding-top: 8px;
          border-top: 1px dashed #ccc;
          margin-top: 6px;
          line-height: 1.4;
        }
        .footer .thanks { font-size: 10px; font-weight: 600; color: #1e293b; }
        .footer .sub { font-size: 7px; color: #999; }
        @media print {
          body { background: white; padding: 0; }
          .receipt { box-shadow: none; border-radius: 0; padding: 8px; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="store-name">✦ <span>${restaurant}</div>
        <div class="tagline">${branch}</div>

        <div class="meta">
          <span class="label">Table</span>
          <span class="value">${order.tableName}</span>
        </div>
        <div class="meta" style="border-bottom: none; padding-top: 0;">
          <span class="label">Date</span>
          <span class="value">${getNepalTimeString()}</span>
        </div>

        <div class="items-head">
          <span class="head-item">Item</span>
          <span class="head-qty">Qty</span>
          <span class="head-price">Price</span>
        </div>

        ${order.items
          .map(
            (i) => `
          <div class="item">
            <div class="item-name">${i.name} <small>${i.unit_name}</small></div>
            <div class="item-qty">${i.quantity}</div>
            <div class="item-price">Rs.${formatMoney(i.total_price)}</div>
          </div>
        `,
          )
          .join("")}

        <hr class="divider" />

        <div class="total">
          <span class="total-label">TOTAL</span>
          <span class="total-amount">Rs. ${formatMoney(order.total_price)}</span>
        </div>

        <div class="footer">
          <div class="thanks">Thank you!</div>
          <div class="sub">We hope to see you again</div>
        </div>
      </div>
    </body>
  </html>
  `);

    w.document.close();
    w.print();
  };

  const printBill = async (order) => {
    if (!token) {
      toast.error("Authentication token missing.");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}api/table/${order.table_reference_id}/bill-print/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            errorData.detail ||
            `Request failed with status ${response.status}`,
        );
      }

      const result = await response.json();

      toast.success("Bill printed and orders marked as paid.");

      printBillContent(order);

      await fetchOrders(token, false);
    } catch (error) {
      toast.error(error.message || "Unable to print bill.");
    }
  };

  useEffect(() => {
    const t = getCookie("adminToken");
    if (!t) {
      console.warn("No admin token found");
      return;
    }

    setToken(t);
    previousOrderIds.current = new Set();
    isFirstLoad.current = true;

    fetchOrders(t, false);

    const interval = setInterval(() => {
      fetchOrders(t, true);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [filter, newStatus]);

  const todayNepal = getNepalDateString(new Date());
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
    .filter((o) => o.status === "Served")
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  return (
    <>
      <div className="min-h-screen font-sans p-4 sm:p-6 lg:p-4 bg-[#ddf4e2]">
        <header className="mx-auto mb-6 flex flex-wrap items-center justify-between gap-y-4 gap-x-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg sm:text-xl font-bold text-[#1C5721] leading-tight">
              Kitchen Dashboard
            </h1>

            <div className="flex flex-wrap gap-2 mt-1">
              <button
                onClick={() => setFilter("today")}
                className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                  filter === "today"
                    ? "bg-[#236B28] text-white shadow-md"
                    : "bg-white text-[#236B28] border border-[#236B28]"
                }`}
              >
                Today
              </button>
              <div className="flex items-center gap-2 bg-white border border-[#236B28] rounded-lg px-3 py-1 shadow-sm">
                <span className="text-[#236B28] font-semibold text-sm">
                  Status
                </span>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                >
                  <option value="pending">🟡 Pending</option>
                  <option value="preparing">🔵 Preparing</option>
                  <option value="ready">🟣 Ready</option>
                  <option value="served">🟢 Served</option>
                  <option value="cancelled">🔴 Cancelled</option>
                  {/* <option value="paid">⚫ Paid</option> */}
                </select>
              </div>
            </div>

            <p className="text-[11px] sm:text-sm text-[#236B28] mt-0.5">
              Displaying{" "}
              <span className="font-bold">{filteredOrders.length}</span> orders
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white px-3 sm:px-4 py-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 sm:gap-3 w-fit shrink-0">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-gray-400 tracking-wider whitespace-nowrap">
                {filter === "today" ? "Today's Revenue" : "7 Days Revenue"}
              </span>
              <div className="h-4 w-px bg-gray-200"></div>
              <span className="text-base sm:text-lg font-bold text-emerald-600 whitespace-nowrap">
                Rs. {totalRevenue.toFixed(2)}
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {filteredOrders.map((order, idx) => (
            <div
              key={`${order.table_reference_id}-${idx}`}
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
                      : order.status === "Paid"
                        ? "bg-gray-100 border-gray-300 text-gray-700"
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

              <div className="p-1 grow">
                <div className="bg-gray-50 rounded p-3 mb-3">
                  <ul className="space-y-2">
                    {order.items.map((i, itemIdx) => (
                      <li
                        key={itemIdx}
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
                       : order.status === "Paid"
                         ? "bg-gray-100 border-gray-300 text-gray-600" // 👈 added
                         : "bg-green-50 border-green-200 text-[#236B28]"
                   }`}
                  >
                    {/* {getStatusIndicator(newStatus)} */}
                    {newStatus}
                  </div>
                  {order.status !== "Cancelled" && order.status !== "Paid" && (
                    <div className="flex gap-2 relative">
                      <button
                        className="p-1.5 rounded-lg bg-green-50 text-[#236B28] hover:bg-[#236B28] hover:text-white transition-all shadow-sm cursor-pointer"
                        onClick={() => printBill(order)}
                        title="Print Bill"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {["Pending", "Preparing", "Ready"].includes(
                        order.status,
                      ) && (
                        <div className="relative">
                          <button
                            className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-500 hover:text-white transition-all shadow-sm cursor-pointer"
                            title="Change Status"
                            onClick={() =>
                              setOpenDropdown((prev) =>
                                prev === order.table_reference_id
                                  ? null
                                  : order.table_reference_id,
                              )
                            }
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>

                          {openDropdown === order.table_reference_id && (
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
                                      handleStatusChange(
                                        order.table_reference_id,
                                        s,
                                      )
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
                    (o) => getNepalDateString(o.created_at) === todayNepal,
                  ).length
                }
              </span>
            </span>
            <div className="hidden md:block h-4 w-px bg-[#236B28]/20"></div>
            <span className="text-[#236B28]/80 font-semibold">
              {filter === "today"
                ? "Current View (Today): "
                : "Current View (7 Days): "}
              <span className="font-black">{filteredOrders.length}</span>
            </span>
            <div className="hidden md:block h-4 w-px bg-[#236B28]/20"></div>
            <span className="text-[#236B28]/80 font-semibold">
              Total Revenue (Served):{" "}
              <span className="font-black">Rs. {totalRevenue.toFixed(0)}</span>
            </span>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
    </>
  );
};

export default AdminOrdersDashboard;
