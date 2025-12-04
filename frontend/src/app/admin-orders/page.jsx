"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Trash2, Printer, CheckCircle, Bell } from "lucide-react";
import Swal from "sweetalert2";

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
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const prevOrdersRef = useRef([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setOrders(JSON.parse(localStorage.getItem("orders")) || []);

    const handleOrdersUpdated = () => {
      setOrders(JSON.parse(localStorage.getItem("orders")) || []);
    };

    window.addEventListener("ordersUpdated", handleOrdersUpdated);

    return () => {
      window.removeEventListener("ordersUpdated", handleOrdersUpdated);
    };
  }, []);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatOrderDate = (dateString) => {
    const date = new Date(dateString);
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const y = date.getFullYear();
    return `${m}/${d}/${y}`;
  };

  const today = getNepalToday();

  const todayOrders = orders.filter((order) => {
    return formatOrderDate(order.time) === today;
  });

  const todayTotal = todayOrders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, todayOrders) => sum + todayOrders.total, 0);
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

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("orders")) || [];
    setOrders(saved.map((o) => ({ ...o, status: o.status || "Pending" })));
    prevOrdersRef.current = saved.map((o) => o.id);
  }, []);

  // Notification checker
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = JSON.parse(localStorage.getItem("orders")) || [];
      const updated = saved.map((o) => ({
        ...o,
        status: o.status || "Pending",
      }));
      const prevIds = prevOrdersRef.current;
      const newOrders = updated.filter((o) => !prevIds.includes(o.id));
      if (newOrders.length > 0) {
        const tableId = newOrders.map((o) => o.tableId).join(", ");
        showToast(`New Order at Table(s): ${tableId}`, "info");
      }
      prevOrdersRef.current = updated.map((o) => o.id);
      setOrders(updated);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // useEffect(() => {
  //   const handleOrdersUpdate = () => {
  //     const saved = JSON.parse(localStorage.getItem("orders")) || [];
  //     const updated = saved.map((o) => ({
  //       ...o,
  //       status: o.status || "Pending",
  //     }));
  //     setOrders(updated);

  //     // Pending count update
  //     const pending = updated.filter((o) => o.status === "Pending");
  //     setPendingOrdersCount(pending.length);

  //     // Notification toast
  //     const newOrders = updated.filter(
  //       (o) => !prevOrdersRef.current.includes(o.id)
  //     );
  //     if (newOrders.length > 0) {
  //       const tableId = newOrders.map((o) => o.tableId).join(", ");
  //       Swal.fire({
  //         toast: true,
  //         position: "top-end",
  //         icon: "info",
  //         title: `New Order at Table(s): ${tableId}`,
  //         showConfirmButton: false,
  //         timer: 3000,
  //         timerProgressBar: true,
  //       });
  //     }

  //     // Ref update
  //     prevOrdersRef.current = updated.map((o) => o.id);
  //   };

  //   // Event listener add
  //   window.addEventListener("ordersUpdated", handleOrdersUpdate);

  //   return () =>
  //     window.removeEventListener("ordersUpdated", handleOrdersUpdate);
  // }, []);

  // Update pending count

  useEffect(() => {
    const pending = orders.filter((o) => o.status === "Pending");
    setPendingOrdersCount(pending.length);
  }, [orders]);

  const saveOrders = (updatedOrders) => {
    setOrders(updatedOrders);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
  };

  const cancelOrder = async (id) => {
    const order = orders.find((o) => o.id === id);

    if (!order) return;

    if (order.status === "Completed") {
      Swal.fire({
        icon: "info",
        title: "Cannot cancel",
        text: "This order has already been completed!",
      });
      return;
    }

    if (order.status === "Cancelled") return;

    const result = await Swal.fire({
      title: "Cancel this order?",
      text: "Customer’s order will be marked as cancelled.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel",
    });

    if (result.isConfirmed) {
      const updatedOrders = orders.map((o) =>
        o.id === id ? { ...o, status: "Cancelled" } : o
      );
      saveOrders(updatedOrders);
      showToast("Order cancelled", "success");
    }
  };

  const toggleStatus = async (id) => {
    const order = orders.find((o) => o.id === id);
    if (!order || order.status === "Cancelled") return;

    const result = await Swal.fire({
      title: "Change Order Status?",
      text: `Change status from ${order.status} to ${
        order.status === "Pending" ? "Completed" : "Pending"
      }?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      const updatedOrders = orders.map((o) =>
        o.id === id
          ? { ...o, status: o.status === "Pending" ? "Completed" : "Pending" }
          : o
      );
      saveOrders(updatedOrders);
      showToast("Order status updated", "success");
    }
  };

  const deleteOrder = async (id) => {
    const result = await Swal.fire({
      title: "Delete Order?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
    });
    if (result.isConfirmed) {
      const updatedOrders = orders.filter((o) => o.id !== id);
      saveOrders(updatedOrders);
      showToast("Order deleted", "success");
    }
  };

  const printBill = (order) => {
    const myWindow = window.open("", "PRINT", "height=600,width=400");
    myWindow.document.write("<h1>Restaurant Bill</h1>");
    myWindow.document.write(`<p>Table: ${order.tableId}</p>`);
    myWindow.document.write(`<p>Time: ${order.time}</p><hr/>`);
    order.items.forEach((i) => {
      const price =
        i.type === "half_full"
          ? i.unit === "Half"
            ? i.halfPrice
            : i.price
          : i.type === "kg"
          ? i.kgQty * i.pricePerKg
          : i.price;
      myWindow.document.write(`<p>${i.name} x ${i.quantity} — Rs.${price}</p>`);
    });
    myWindow.document.write(
      `<hr/><h3>Total: Rs.${order.total.toFixed(2)}</h3>`
    );
    myWindow.document.close();
    myWindow.focus();
    myWindow.print();
    myWindow.close();
  };

  const getStatusIndicator = (status) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
        );
      case "Completed":
        return (
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
        );
      case "Cancelled":
        return (
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
        );
      default:
        return null;
    }
  };

  const totalOrders = todayOrders.length;
  const pendingOrders = todayOrders.filter(
    (o) => o.status === "Pending"
  ).length;
  const completedOrders = todayOrders.filter(
    (o) => o.status === "Completed"
  ).length;
  const cancelledOrders = todayOrders.filter(
    (o) => o.status === "Cancelled"
  ).length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 p-5 rounded-xl bg-white shadow-sm border">
        <h1 className="text-3xl font-bold text-amber-700 tracking-wide">
          Royal Dine Dashboard
        </h1>
        <div className="relative">
          <button
            ref={dropdownRef}
            className="relative p-3 bg-amber-50 hover:bg-amber-100 rounded-full shadow-sm"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-6 h-6 text-amber-700" />
            {todayOrders.filter((o) => o.status === "Pending").length > 0 && (

              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          {showNotifications &&
            todayOrders.filter((o) => o.status === "Pending").length > 0 && (
              <div className="absolute right-0 mt-3 w-56 bg-white shadow-xl border rounded-lg z-50">
                <p className="p-3 font-semibold border-b bg-gray-50">
                  New Orders
                </p>

                {todayOrders
                  .filter((o) => o.status === "Pending")
                  .map((o) => (
                    <p key={o.id} className="p-2 text-sm border-b">
                      Table # {o.tableId}
                    </p>
                  ))}
              </div>
            )}
        </div>
      </div>

      <h1 className="text-xl font-semibold mb-4">Today’s Orders {today}</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl shadow bg-white border text-center hover:scale-105 transition">
          <p className="text-gray-500 text-sm">Total Orders</p>
          <p className="text-3xl font-extrabold text-gray-700 mt-1">
            {totalOrders}
          </p>
        </div>

        <div className="p-5 rounded-xl shadow bg-yellow-50 border text-center hover:scale-105 transition">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-3xl font-extrabold text-yellow-600 mt-1">
            {pendingOrders}
          </p>
        </div>

        <div className="p-5 rounded-xl shadow bg-green-50 border text-center hover:scale-105 transition">
          <p className="text-gray-600 text-sm">Completed</p>
          <p className="text-3xl font-extrabold text-green-600 mt-1">
            {completedOrders}
          </p>
        </div>

        <div className="p-5 rounded-xl shadow bg-red-50 border text-center hover:scale-105 transition">
          <p className="text-gray-600 text-sm">Cancelled</p>
          <p className="text-3xl font-extrabold text-red-600 mt-1">
            {cancelledOrders}
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {todayOrders.map((order, idx) => (
          <div
            key={order.id}
            className={`relative p-5 border rounded-xl shadow-sm bg-white hover:shadow-md transition ${
              order.status === "Cancelled" ? "opacity-50" : ""
            }`}
          >
            {order.status !== "Cancelled" && (
              <button
                className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 rounded"
                onClick={() => cancelOrder(order.id)}
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">#Order: {idx + 1}</span>
              <span
                className={` font-semibold ${
                  order.status === "Pending"
                    ? "text-yellow-500"
                    : order.status === "Completed"
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                -- Table: {order.tableId}
              </span>
            </div>

            <p className="mb-2 text-sm text-gray-500">{order.time}</p>

            <ul className="ml-2 mb-2">
              {order.items.map((i) => {
                const price =
                  i.type === "half_full"
                    ? i.unit === "Half"
                      ? i.halfPrice
                      : i.price
                    : i.type === "kg"
                    ? i.kgQty * i.pricePerKg
                    : i.price;
                return (
                  <li key={i.id || i.name}>
                    {i.name} {i.type === "half_full" ? `(${i.unit})` : ""} x{" "}
                    {i.quantity} — Rs.{price.toFixed(2)}
                  </li>
                );
              })}
            </ul>

            <p className="font-bold mt-2">Total: Rs.{order.total.toFixed(2)}</p>

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
                      className={`p-1 rounded hover:scale-110 transition ${
                        order.status === "Pending"
                          ? "text-yellow-500 hover:text-yellow-600"
                          : "text-green-500 hover:text-green-600"
                      }`}
                      onClick={() => toggleStatus(order.id)}
                    >
                      <CheckCircle />
                    </button>
                  </>
                )}
                <button
                  className="text-red-500 hover:text-red-600 p-1 rounded"
                  onClick={() => deleteOrder(order.id)}
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
        <span className="font-semibold text-lg text-gray-700">
          Today’s Total Amount
        </span>
        <span className="text-2xl font-extrabold text-amber-600">
          Rs. {todayTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default AdminOrdersDashboard;




// "use client";

// import React, { useEffect, useRef, useState } from "react";
// import { X, Trash2, Printer, CheckCircle, Bell } from "lucide-react";
// import Swal from "sweetalert2";

// const AdminOrdersDashboard = () => {
//   const [orders, setOrders] = useState([]);
//   const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
//   const [showNotifications, setShowNotifications] = useState(false);
//   const prevOrdersRef = useRef([]);
//   const [loading, setLoading] = useState(true);

//   const getNepalToday = () => {
//     const now = new Date();
//     const nepalTime = new Date(now.getTime() + 5.75 * 60 * 60 * 1000);
//     return nepalTime.toISOString().split("T")[0];
//   };

//   const today = getNepalToday();

//   const todayOrders = orders.filter((order) => {
//     const orderDate = order.date?.split("T")[0];
//     return orderDate === today;
//   });

//   const showToast = (message, icon = "success") => {
//     Swal.fire({
//       toast: true,
//       position: "top-end",
//       icon,
//       title: message,
//       showConfirmButton: false,
//       timer: 3000,
//       timerProgressBar: true,
//     });
//   };

//   useEffect(() => {
//     const saved = JSON.parse(localStorage.getItem("orders")) || [];
//     setOrders(saved.map((o) => ({ ...o, status: o.status || "Pending" })));
//     prevOrdersRef.current = saved.map((o) => o.id);
//   }, []);

//   // Notification checker
//   useEffect(() => {
//     const interval = setInterval(() => {
//       const saved = JSON.parse(localStorage.getItem("orders")) || [];
//       const updated = saved.map((o) => ({
//         ...o,
//         status: o.status || "Pending",
//       }));
//       const prevIds = prevOrdersRef.current;
//       const newOrders = updated.filter((o) => !prevIds.includes(o.id));
//       if (newOrders.length > 0) {
//         const tableId = newOrders.map((o) => o.tableId).join(", ");
//         showToast(`New Order at Table(s): ${tableId}`, "info");
//       }
//       prevOrdersRef.current = updated.map((o) => o.id);
//       setOrders(updated);
//     }, 9000);

//     return () => clearInterval(interval);
//   }, []);

//   // Update pending count
//   useEffect(() => {
//     const pending = orders.filter((o) => o.status === "Pending");
//     setPendingOrdersCount(pending.length);
//   }, [orders]);

//   const saveOrders = (updatedOrders) => {
//     setOrders(updatedOrders);
//     localStorage.setItem("orders", JSON.stringify(updatedOrders));
//   };

//   const cancelOrder = async (id) => {
//     const result = await Swal.fire({
//       title: "Cancel this order?",
//       text: "Customer’s order will be marked as cancelled.",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, Cancel",
//     });
//     if (result.isConfirmed) {
//       const updatedOrders = orders.map((o) =>
//         o.id === id ? { ...o, status: "Cancelled" } : o
//       );
//       saveOrders(updatedOrders);
//       showToast("Order cancelled", "success");
//     }
//   };

//   const toggleStatus = async (id) => {
//     const order = orders.find((o) => o.id === id);
//     if (!order || order.status === "Cancelled") return;

//     const result = await Swal.fire({
//       title: "Change Order Status?",
//       text: `Change status from ${order.status} to ${
//         order.status === "Pending" ? "Completed" : "Pending"
//       }?`,
//       icon: "question",
//       showCancelButton: true,
//       confirmButtonText: "Yes",
//       cancelButtonText: "No",
//     });

//     if (result.isConfirmed) {
//       const updatedOrders = orders.map((o) =>
//         o.id === id
//           ? { ...o, status: o.status === "Pending" ? "Completed" : "Pending" }
//           : o
//       );
//       saveOrders(updatedOrders);
//       showToast("Order status updated", "success");
//     }
//   };

//   const deleteOrder = async (id) => {
//     const result = await Swal.fire({
//       title: "Delete Order?",
//       text: "This action cannot be undone!",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Yes, Delete",
//     });
//     if (result.isConfirmed) {
//       const updatedOrders = orders.filter((o) => o.id !== id);
//       saveOrders(updatedOrders);
//       showToast("Order deleted", "success");
//     }
//   };

//   const printBill = (order) => {
//     const myWindow = window.open("", "PRINT", "height=600,width=400");
//     myWindow.document.write("<h1>Restaurant Bill</h1>");
//     myWindow.document.write(`<p>Table: ${order.tableId}</p>`);
//     myWindow.document.write(`<p>Time: ${order.time}</p><hr/>`);
//     order.items.forEach((i) => {
//       const price =
//         i.type === "half_full"
//           ? i.unit === "Half"
//             ? i.halfPrice
//             : i.price
//           : i.type === "kg"
//           ? i.kgQty * i.pricePerKg
//           : i.price;
//       myWindow.document.write(`<p>${i.name} x ${i.quantity} — Rs.${price}</p>`);
//     });
//     myWindow.document.write(
//       `<hr/><h3>Total: Rs.${order.total.toFixed(2)}</h3>`
//     );
//     myWindow.document.close();
//     myWindow.focus();
//     myWindow.print();
//     myWindow.close();
//   };

//   const getStatusIndicator = (status) => {
//     switch (status) {
//       case "Pending":
//         return (
//           <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
//         );
//       case "Completed":
//         return (
//           <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
//         );
//       case "Cancelled":
//         return (
//           <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
//         );
//       default:
//         return null;
//     }
//   };

//   const totalOrders = orders.length;
//   const pendingOrders = orders.filter((o) => o.status === "Pending").length;
//   const completedOrders = orders.filter((o) => o.status === "Completed").length;
//   const cancelledOrders = orders.filter((o) => o.status === "Cancelled").length;

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen ">
//       {/* Header with bell */}
//       <div className="flex justify-between items-center mb-6  p-4 rounded bg-amber-100">
//         <h1 className="text-3xl font-bold  text-orange-600">
//           Royal Dine Dashboard
//         </h1>

//         <div className="relative">
//           <button
//             className="relative p-2 text-gray-700 hover:text-amber-700 cursor-pointer"
//             onClick={() => setShowNotifications(!showNotifications)}
//           >
//             <Bell className="w-6 h-6" />
//             {pendingOrdersCount > 0 && (
//               <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
//                 {pendingOrdersCount}
//               </span>
//             )}
//           </button>

//           {/* Notification dropdown */}
//           {showNotifications && pendingOrdersCount > 0 && (
//             <div className="absolute right-0 mt-2 w-48 bg-white border shadow-lg rounded-md z-50 ">
//               <p className="p-2 font-semibold border-b">New Orders</p>
//               {orders
//                 .filter((o) => o.status === "Pending")
//                 .map((o) => (
//                   <p key={o.id} className="p-2 text-sm border-b">
//                     Table # {o.tableId}
//                   </p>
//                 ))}
//             </div>
//           )}
//         </div>
//       </div>

//       <h1 className="text-xl font-sm mb-7"> Today’s Orders ({today})</h1>

//       {/* Stats */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         <div className="p-4 bg-white rounded-lg shadow flex flex-col items-center">
//           <p className="text-gray-500">Total Orders</p>
//           <p className="text-xl font-bold">{totalOrders}</p>
//         </div>
//         <div className="p-4 bg-white rounded-lg shadow flex flex-col items-center">
//           <p className="text-gray-500">Pending</p>
//           <p className="text-xl font-bold text-yellow-500">{pendingOrders}</p>
//         </div>
//         <div className="p-4 bg-white rounded-lg shadow flex flex-col items-center">
//           <p className="text-gray-500">Completed</p>
//           <p className="text-xl font-bold text-green-500">{completedOrders}</p>
//         </div>
//         <div className="p-4 bg-white rounded-lg shadow flex flex-col items-center">
//           <p className="text-gray-500">Cancelled</p>
//           <p className="text-xl font-bold text-red-500">{cancelledOrders}</p>
//         </div>
//       </div>

//       {/* Orders */}

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//         {orders.map((order, idx) => (
//           <div
//             key={order.id}
//             className={`relative p-4 border rounded-lg shadow bg-white ${
//               order.status === "Cancelled" ? "opacity-50" : ""
//             }`}
//           >
//             {order.status !== "Cancelled" && (
//               <button
//                 className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"
//                 onClick={() => cancelOrder(order.id)}
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             )}

//             <p className="font-semibold mb-2">
//               Order #{idx + 1} - Table {order.tableId}
//             </p>
//             <p className="mb-2 text-sm text-gray-500">{order.time}</p>

//             <ul className="ml-2 mb-2">
//               {order.items.map((i) => {
//                 const price =
//                   i.type === "half_full"
//                     ? i.unit === "Half"
//                       ? i.halfPrice
//                       : i.price
//                     : i.type === "kg"
//                     ? i.kgQty * i.pricePerKg
//                     : i.price;
//                 return (
//                   <li key={i.id || i.name}>
//                     {i.name} {i.type === "half_full" ? `(${i.unit})` : ""} x{" "}
//                     {i.quantity} — Rs.{price.toFixed(2)}
//                   </li>
//                 );
//               })}
//             </ul>

//             <p className="font-bold mt-2">Total: Rs.{order.total.toFixed(2)}</p>

//             <div className="flex justify-between mt-4 items-center">
//               <div className="flex items-center">
//                 {getStatusIndicator(order.status)}
//                 <span className="text-sm font-medium">{order.status}</span>
//               </div>

//               <div className="flex gap-10">
//                 {order.status !== "Cancelled" && (
//                   <>
//                     <button
//                       className="text-blue-500 hover:text-blue-600"
//                       onClick={() => printBill(order)}
//                     >
//                       <Printer />
//                     </button>
//                     <button
//                       className={`hover:scale-110 transition-transform p-1 rounded ${
//                         order.status === "Pending"
//                           ? "text-yellow-500 hover:text-yellow-600"
//                           : "text-green-500 hover:text-green-600"
//                       }`}
//                       onClick={() => toggleStatus(order.id)}
//                     >
//                       <CheckCircle />
//                     </button>
//                   </>
//                 )}
//                 <button
//                   className="text-red-500 hover:text-red-600"
//                   onClick={() => deleteOrder(order.id)}
//                 >
//                   <Trash2 />
//                 </button>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default AdminOrdersDashboard;
