"use client";

import { useState, useEffect } from "react";
import CartSidebar from "@/components/CartSidebar";
import { menuItems } from "@/data/MenuData";
import ToastProvider from "@/components/ToastProvider";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";

const TableMenuPage = () => {
  const params = useParams();
  const tableNameFromURL = params?.tableName || null;

  const [cartItems, setCartItems] = useState([]);
  const [menu, setMenu] = useState([]);
  const [table, setTable] = useState(null); // table found / not found
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(true);

  const clearCart = () => setCartItems([]);

// Load tables from localStorage & match with URL
useEffect(() => {
  console.log("📌 URL Table Name (slug):", tableNameFromURL);

  const savedTables = localStorage.getItem("tables");
  let parsedTables = [];

  try {
    parsedTables = savedTables ? JSON.parse(savedTables) : [];
  } catch (err) {
    console.error("❌ Error parsing tables from localStorage:", err);
  }

  console.log("📦 Loaded Tables From localStorage:", parsedTables);

  if (!tableNameFromURL) {
    console.log("❌ No tableName found in URL");
    setTable(false);
    setLoading(false);
    return;
  }

  if (parsedTables.length === 0) {
    console.log("❌ No tables stored in localStorage");
    setTable(false);
    setLoading(false);
    return;
  }

  const slugToNormal = tableNameFromURL.replace(/-/g, " ").toLowerCase();
  console.log("🔄 Converted Slug To Normal:", slugToNormal);

  const foundTable = parsedTables.find((t) => {
    if (!t.table_name) return false;
    return t.table_name.toLowerCase() === slugToNormal;
  });

  if (!foundTable) {
    console.log("❌ Table not found in saved tables");
    setTable(false);
  } else {
    console.log("✅ Table Found:", foundTable);
    setTable(foundTable);
  }

  setLoading(false);
}, [tableNameFromURL]);


// useEffect(() => {
//   const fetchTables = async () => {
//     setLoading(true);
//     try {
//       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tables`);
//       const data = await res.json();

//       if (!tableNameFromURL) {
//         setTable(false);
//         setLoading(false);
//         return;
//       }

//       const slugToNormal = tableNameFromURL.replace(/-/g, " ").toLowerCase();
//       const foundTable = data.find((t) => t.table_name.toLowerCase() === slugToNormal);

//       if (!foundTable) setTable(false);
//       else setTable(foundTable);

//     } catch (err) {
//       console.error("Failed to fetch tables:", err);
//       setTable(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchTables();
// }, [tableNameFromURL]);

  useEffect(() => {
    setMenu(menuItems);
  }, []);

if (loading)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-600 mx-auto"></div>
        <p className="mt-4 text-xl text-gray-700">Loading Table...</p>
      </div>
    </div>
  );

  // ❌ Table Not Found
  if (table === false) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <h1 className="text-4xl font-bold text-red-600">❌ Table Not Available</h1>
        <p className="mt-2 text-lg text-gray-700">
          This table does not exist in the system.
        </p>
      </div>
    );
  }

  // ✅ Table Found
  return (
    <div className="min-h-screen bg-gray-50">
      <ToastProvider />

      {/* Table header */}
      <h1 className="p-5 text-2xl font-bold">
        Table: {table?.table_name}
      </h1>

      {/* CartSidebar */}
      {isCartOpen && (
        <CartSidebar
          isOpen={true}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQuantity={(id, qty) => {
            if (qty <= 0) {
              setCartItems(cartItems.filter((c) => c.id !== id));
              toast("✔️ Item removed from your cart.");
            } else {
              setCartItems(
                cartItems.map((c) =>
                  c.id === id ? { ...c, quantity: qty } : c
                )
              );
            }
          }}
          onRemove={(id) => {
            setCartItems(cartItems.filter((c) => c.id !== id));
            toast("✔️ Item removed from your cart.");
          }}
          onAdd={(item, unit = "Full") => {
            const exists = cartItems.find(
              (c) => c.id === item.id && (c.unit || "Full") === unit
            );
            if (exists) {
              setCartItems(
                cartItems.map((c) =>
                  c.id === item.id && (c.unit || "Full") === unit
                    ? { ...c, quantity: c.quantity + 1 }
                    : c
                )
              );
            } else {
              if (item.type === "half_full") {
                setCartItems([...cartItems, { ...item, unit, quantity: 1 }]);
              } else if (item.type === "kg") {
                setCartItems([
                  ...cartItems,
                  { ...item, kgQty: 1, quantity: 1 },
                ]);
              } else {
                setCartItems([...cartItems, { ...item, quantity: 1 }]);
              }
            }
          }}
          onUnitChange={(id, unit) =>
            setCartItems(
              cartItems.map((c) => (c.id === id ? { ...c, unit } : c))
            )
          }
          onKgChange={(id, kgQty) =>
            setCartItems(
              cartItems.map((c) =>
                c.id === id ? { ...c, kgQty, quantity: kgQty } : c
              )
            )
          }
          menu={menu}
          tableName={table.table_name}
           selectedTable={table}  
          onClearCart={clearCart}
        />
      )}
    </div>
  );
};

export default TableMenuPage;
