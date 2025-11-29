"use client";

import React, { useEffect, useState } from "react";
import { X, Trash2, Printer, CheckCircle } from "lucide-react";
import Swal from "sweetalert2";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("orders")) || [];
    const updated = saved.map((o) => ({ ...o, status: o.status || "Pending" }));
    setOrders(updated);
  }, []);

  const saveOrders = (updatedOrders) => {
    setOrders(updatedOrders);
    localStorage.setItem("orders", JSON.stringify(updatedOrders));
  };

  const printBill = (order) => {
    const myWindow = window.open("", "PRINT", "height=600,width=400");
    myWindow.document.write("<h1>Restaurant Bill</h1>");
    myWindow.document.write(`<p>Table: ${order.tableId}</p>`);
    myWindow.document.write(`<p>Time: ${order.time}</p><hr/>`);
    order.items.forEach((i) => {
      myWindow.document.write(
        `<p>${i.name} x ${i.quantity} — Rs.${i.price * i.quantity}</p>`
      );
    });
    myWindow.document.write(`<hr/><h3>Total: Rs.${order.total}</h3>`);
    myWindow.document.close();
    myWindow.focus();
    myWindow.print();
    myWindow.close();
  };

  // DELETE ORDER WITH CONFIRM
  const deleteOrder = async (id) => {
    const result = await Swal.fire({
      title: "Delete Order?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      const updatedOrders = orders.filter((order) => order.id !== id);
      saveOrders(updatedOrders);
      Swal.fire("Deleted!", "Order has been removed.", "success");
    }
  };

  // CANCEL ORDER WITH CONFIRM
  const cancelOrder = async (id) => {
    const result = await Swal.fire({
      title: "Cancel this order?",
      text: "Customer’s order will be marked as cancelled.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Cancel",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      const updatedOrders = orders.map((order) =>
        order.id === id ? { ...order, status: "Cancelled" } : order
      );
      saveOrders(updatedOrders);
      Swal.fire("Cancelled!", "The order has been cancelled.", "success");
    }
  };

  // TOGGLE STATUS WITH CONFIRM
  const toggleStatus = async (id) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;

    const result = await Swal.fire({
      title: "Change Order Status?",
      text: `Change status from ${order.status} to ${
        order.status === "Pending" ? "Completed" : "Pending"
      }?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Change",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      const updatedOrders = orders.map((o) =>
        o.id === id
          ? {
              ...o,
              status:
                o.status === "Pending"
                  ? "Completed"
                  : o.status === "Completed"
                  ? "Pending"
                  : o.status,
            }
          : o
      );
      saveOrders(updatedOrders);
      Swal.fire("Updated!", "Order status changed.", "success");
    }
  };

  const getStatusIndicator = (status) => {
    switch (status) {
      case "Pending":
        return <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>;
      case "Completed":
        return <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>;
      case "Cancelled":
        return <span className="underline text-red-500 mr-2">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-orange-600 mb-4">Royal Dine Restaurant Orders</h1>

      {orders.length === 0 && <p>No orders yet...</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {orders.map((order, index) => (
          <div
            key={order.id}
            className={`relative p-4 border rounded-lg shadow ${
              order.status === "Cancelled" ? "opacity-50" : ""
            }`}
          >
            <p>
              <b>S.N: </b> {index + 1}
            </p>

            {/* Cancel X icon top-right */}
            {order.status !== "Cancelled" && (
              <button
                className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"
                onClick={() => cancelOrder(order.id)}
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <p className="flex items-center">
              {getStatusIndicator(order.status)}
              <b>Table: </b> {order.tableId}
            </p>
            <p>
              <b>Time: </b> {order.time}
            </p>

            <ul className="ml-4 mt-2">
              {order.items.map((i) => (
                <li key={i.name}>
                  {i.name} x {i.quantity} — Rs.{i.price * i.quantity}
                </li>
              ))}
            </ul>

            <p className="font-bold mt-3">Total: Rs.{order.total}</p>

            {/* Icon Buttons */}
            <div className="mt-3 flex gap-16">
              {order.status !== "Cancelled" && (
                <>
                  <button
                    className="p-2 text-blue-500 hover:text-blue-700 rounded cursor-pointer"
                    onClick={() => printBill(order)}
                    title="Print Bill"
                  >
                    <Printer className="w-5 h-5" />
                  </button>

                  <button
                    className={`p-2 rounded hover:opacity-80 ${
                      order.status === "Pending"
                        ? "text-yellow-500 cursor-pointer"
                        : order.status === "Completed"
                        ? "text-green-500 cursor-pointer"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                    onClick={() =>
                      order.status !== "Cancelled" && toggleStatus(order.id)
                    }
                    title="Toggle Status"
                    disabled={order.status === "Cancelled"}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Delete always */}
              <button
                className="p-2 text-red-700 cursor-pointer rounded hover:text-red-800"
                onClick={() => deleteOrder(order.id)}
                title="Delete Order"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
