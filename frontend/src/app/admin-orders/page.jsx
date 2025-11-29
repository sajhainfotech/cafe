"use client";

import React, { useEffect, useState } from "react";

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("orders")) || [];
    setOrders(saved);
  }, []);

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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Restaurant Orders</h1>

      {orders.length === 0 && <p>No orders yet...</p>}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="p-4 border rounded-lg shadow">
            <p><b>Table:</b> {order.tableId}</p>
            <p><b>Time:</b> {order.time}</p>

            <ul className="ml-4 mt-2">
              {order.items.map((i) => (
                <li key={i.name}>
                  {i.name} x {i.quantity} — Rs.{i.price * i.quantity}
                </li>
              ))}
            </ul>

            <p className="font-bold mt-3">Total: Rs.{order.total}</p>

            <button
              className="mt-3 bg-black text-white px-4 py-2 rounded"
              onClick={() => printBill(order)}
            >
              Print Bill
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOrdersPage;
