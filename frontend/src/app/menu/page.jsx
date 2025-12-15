"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { ShoppingCart } from "lucide-react";
import ToastProvider from "@/components/ToastProvider";
import { useSearchParams } from "next/navigation";
import { Commet } from "react-loading-indicators";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CustomerMenu() {
  const [menuList, setMenuList] = useState([]);
  const [units, setUnits] = useState([]);
  const [tableNumber, setTableNumber] = useState("-");
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();

  useEffect(() => {
    const tableToken = searchParams.get("table_token");

    if (tableToken) {
      fetchTableName(tableToken);
    } else {
      setTableNumber("-");
    }

    fetchMenus(tableToken || "");
    fetchUnits(tableToken || "");
  }, [searchParams]);

  const fetchMenus = async (token) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const headers = adminToken
        ? { Authorization: `Token ${adminToken}` } 
        : token
        ? { "Table-Token": token }
        : {};

      const res = await axios.get(`${API_URL}/api/menus/`, { headers });
      const menus = res.data.data || [];
      setMenuList(menus.map((m) => ({ ...m, quantity: 0 })));
      setLoading(false);
    } catch (err) {
      console.error("❌ fetchMenus error:", err);
      toast.error("Failed to load menus");
      setLoading(false);
    }
  };

  const fetchUnits = async (token) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const headers = adminToken
        ? { Authorization: `Token ${adminToken}` }
        : token
        ? { "Table-Token": token }
        : {};

      const res = await axios.get(`${API_URL}/api/units/`, { headers });
      setUnits(res.data.data || []);
    } catch (err) {
      console.error("❌ fetchUnits error:", err);
      toast.error("Failed to load units");
    }
  };

  const fetchTableName = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/api/tables/`, {
        headers: { "Table-Token": token },
      });
      const table = res.data.data?.find((t) => t.token === token);
      setTableNumber(table?.table_number || "-");
    } catch (err) {
      console.error("❌ fetchTableName error:", err);
      setTableNumber("-");
    }
  };

  const handleQuantityChange = (menuId, change) => {
    setMenuList((prev) =>
      prev.map((item) =>
        item.reference_id === menuId
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      )
    );
  };

  const totalItems = menuList.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = menuList.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleSubmitOrder = async () => {
    try {
      const tableToken = searchParams.get("table_token");

      const cartItems = menuList.filter((i) => i.quantity > 0);
      if (!cartItems.length) {
        toast.error("No items in cart!");
        return;
      }

      const formData = new FormData();
      formData.append("table_token", tableToken);

      cartItems.forEach((item, index) => {
        formData.append(`items[${index}][menu_id]`, item.reference_id);
        formData.append(`items[${index}][quantity]`, item.quantity);
        formData.append(`items[${index}][item_price]`, item.price);
        formData.append(
          `items[${index}][total_price]`,
          item.price * item.quantity
        );
      });

      const res = await fetch(`${API_URL}/api/orders/`, {
        method: "POST",
        headers: { "Table-Token": tableToken },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.response_code !== "0") {
        toast.error("Order validation failed");
        return;
      }

      toast.success("Order placed successfully ✅");
      setMenuList((prev) => prev.map((i) => ({ ...i, quantity: 0 })));
    } catch (error) {
      console.error("❌ Order submit error:", error);
      toast.error("Something went wrong");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <Commet color="#f59e0b" size="medium" textColor="#f59e0b" />
        </div>
      </div>
    );

  return (
    <div className="container mx-auto  sm:p-6 ">
      <ToastProvider />

      <div className="w-full border-b border-amber-600 px-3 py-3  bg-amber-50 rounded-b-xl">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-amber-600">Menu</h1>
          <div className="relative">
            <ShoppingCart className="h-6 w-6 text-amber-700" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                {totalItems}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-amber-700 mt-1">Table {tableNumber}</p>
      </div>

      <div className="space-y-4 mt-6 p-2">
        {menuList.map((menu) => (
          <div
            key={menu.reference_id}
            className="flex bg-amber-50 border-l-4 border-amber-600 p-3 rounded-lg shadow"
          >
            <img
              src={menu.image_url}
              alt={menu.name}
              className="w-24 h-24 rounded mr-4"
            />
            <div className="flex-1 flex justify-between">
              <div>
                <h2 className="text-xl font-bold text-amber-700">
                  {menu.name}
                </h2>
                <p className="font-semibold">Rs {menu.price}</p>
                <p className="text-sm text-gray-600">
                  Unit:{" "}
                  {units.find((u) => u.reference_id === menu.unit)?.name ||
                    "N/A"}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-13">
                <button
                  onClick={() => handleQuantityChange(menu.reference_id, -1)}
                  className="w-10 h-10 border rounded-full font-bold border-amber-600"
                >
                  -
                </button>
                <span>{menu.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(menu.reference_id, 1)}
                  className="w-10 h-10 border rounded-full font-bold border-amber-600"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-amber-50 border-t rounded-t-3xl p-4 shadow-xl">
          <div className="flex justify-between font-bold">
            <span>Total Items: {totalItems}</span>
            <span>Total: Rs {totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={handleSubmitOrder}
              className="bg-amber-500 px-6 py-2 rounded font-bold"
            >
              Place Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
