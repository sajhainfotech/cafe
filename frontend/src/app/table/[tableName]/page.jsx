// "use client";

// import { useState, useEffect } from "react";
// import CartSidebar from "@/components/CartSidebar";
// import { menuItems } from "@/data/MenuData";
// import ToastProvider from "@/components/ToastProvider";
// import toast from "react-hot-toast";
// import { useParams } from "next/navigation";

// const TableMenuPage = () => {
//   const params = useParams();
//   const tableNameFromURL = params?.tableName || null;

//   const [cartItems, setCartItems] = useState([]);
//   const [menu, setMenu] = useState([]);
//   const [table, setTable] = useState(null); // table found / not found
//   const [loading, setLoading] = useState(true);
//   const [isCartOpen, setIsCartOpen] = useState(true);

//   const clearCart = () => setCartItems([]);

// // Load tables from localStorage & match with URL
// useEffect(() => {
//   console.log("📌 URL Table Name (slug):", tableNameFromURL);

//   const savedTables = localStorage.getItem("tables");
//   let parsedTables = [];

//   try {
//     parsedTables = savedTables ? JSON.parse(savedTables) : [];
//   } catch (err) {
//     console.error("❌ Error parsing tables from localStorage:", err);
//   }

//   console.log("📦 Loaded Tables From localStorage:", parsedTables);

//   if (!tableNameFromURL) {
//     console.log("❌ No tableName found in URL");
//     setTable(false);
//     setLoading(false);
//     return;
//   }

//   if (parsedTables.length === 0) {
//     console.log("❌ No tables stored in localStorage");
//     setTable(false);
//     setLoading(false);
//     return;
//   }

//   const slugToNormal = tableNameFromURL.replace(/-/g, " ").toLowerCase();
//   console.log("🔄 Converted Slug To Normal:", slugToNormal);

//   const foundTable = parsedTables.find((t) => {
//     if (!t.table_name) return false;
//     return t.table_name.toLowerCase() === slugToNormal;
//   });

//   if (!foundTable) {
//     console.log("❌ Table not found in saved tables");
//     setTable(false);
//   } else {
//     console.log("✅ Table Found:", foundTable);
//     setTable(foundTable);
//   }

//   setLoading(false);
// }, [tableNameFromURL]);


// // useEffect(() => {
// //   const fetchTables = async () => {
// //     setLoading(true);
// //     try {
// //       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tables`);
// //       const data = await res.json();

// //       if (!tableNameFromURL) {
// //         setTable(false);
// //         setLoading(false);
// //         return;
// //       }

// //       const slugToNormal = tableNameFromURL.replace(/-/g, " ").toLowerCase();
// //       const foundTable = data.find((t) => t.table_name.toLowerCase() === slugToNormal);

// //       if (!foundTable) setTable(false);
// //       else setTable(foundTable);

// //     } catch (err) {
// //       console.error("Failed to fetch tables:", err);
// //       setTable(false);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   fetchTables();
// // }, [tableNameFromURL]);

//   useEffect(() => {
//     setMenu(menuItems);
//   }, []);

// if (loading)
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-100">
//       <div className="text-center">
//         <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-600 mx-auto"></div>
//         <p className="mt-4 text-xl text-gray-700">Loading Table...</p>
//       </div>
//     </div>
//   );

//   // ❌ Table Not Found
//   if (table === false) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
//         <h1 className="text-4xl font-bold text-red-600">❌ Table Not Available</h1>
//         <p className="mt-2 text-lg text-gray-700">
//           This table does not exist in the system.
//         </p>
//       </div>
//     );
//   }

//   // ✅ Table Found
//   return (
//     <div className="min-h-screen bg-gray-50">
//       <ToastProvider />

//       {/* Table header */}
//       <h1 className="p-5 text-2xl font-bold">
//         Table: {table?.table_name}
//       </h1>

//       {/* CartSidebar */}
//       {isCartOpen && (
//         <CartSidebar
//           isOpen={true}
//           onClose={() => setIsCartOpen(false)}
//           items={cartItems}
//           onUpdateQuantity={(id, qty) => {
//             if (qty <= 0) {
//               setCartItems(cartItems.filter((c) => c.id !== id));
//               toast("✔️ Item removed from your cart.");
//             } else {
//               setCartItems(
//                 cartItems.map((c) =>
//                   c.id === id ? { ...c, quantity: qty } : c
//                 )
//               );
//             }
//           }}
//           onRemove={(id) => {
//             setCartItems(cartItems.filter((c) => c.id !== id));
//             toast("✔️ Item removed from your cart.");
//           }}
//           onAdd={(item, unit = "Full") => {
//             const exists = cartItems.find(
//               (c) => c.id === item.id && (c.unit || "Full") === unit
//             );
//             if (exists) {
//               setCartItems(
//                 cartItems.map((c) =>
//                   c.id === item.id && (c.unit || "Full") === unit
//                     ? { ...c, quantity: c.quantity + 1 }
//                     : c
//                 )
//               );
//             } else {
//               if (item.type === "half_full") {
//                 setCartItems([...cartItems, { ...item, unit, quantity: 1 }]);
//               } else if (item.type === "kg") {
//                 setCartItems([
//                   ...cartItems,
//                   { ...item, kgQty: 1, quantity: 1 },
//                 ]);
//               } else {
//                 setCartItems([...cartItems, { ...item, quantity: 1 }]);
//               }
//             }
//           }}
//           onUnitChange={(id, unit) =>
//             setCartItems(
//               cartItems.map((c) => (c.id === id ? { ...c, unit } : c))
//             )
//           }
//           onKgChange={(id, kgQty) =>
//             setCartItems(
//               cartItems.map((c) =>
//                 c.id === id ? { ...c, kgQty, quantity: kgQty } : c
//               )
//             )
//           }
//           menu={menu}
//           tableName={table.table_name}
//            selectedTable={table}  
//           onClearCart={clearCart}
//         />
//       )}
//     </div>
//   );
// };

// export default TableMenuPage;
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import CartSidebar from "@/components/CartSidebar";
import AddItemForm from "@/components/AddItemForm";
import ToastProvider from "@/components/ToastProvider";
import toast from "react-hot-toast";

// Base URL of your API

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TableMenuPage() {
  const params = useParams();
  const tableNameFromURL = params?.tableName || null;

  const [menu, setMenu] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(true);

  // Fetch menu from API
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await axios.get(`${API_URL}/_URL/menu`);
        setMenu(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load menu from API");
      }
    };
    fetchMenu();
  }, []);

  // Fetch cart from API or fallback to localStorage
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/cart`);
        setCartItems(res.data);
      } catch {
        // fallback to localStorage
        const savedCart = localStorage.getItem("cart");
        if (savedCart) setCartItems(JSON.parse(savedCart));
      }
    };
    fetchCart();
  }, []);

  // Fetch table info from API
  useEffect(() => {
    const fetchTable = async () => {
      try {
        if (!tableNameFromURL) {
          setTable(false);
        } else {
          const res = await axios.get(`${API_URL}/api/tables`);
          const slug = tableNameFromURL.replace(/-/g, " ").toLowerCase();
          const found = res.data.find((t) => t.table_name.toLowerCase() === slug);
          setTable(found || false);
        }
      } catch (err) {
        console.error(err);
        setTable(false);
      }
      setLoading(false);
    };
    fetchTable();
  }, [tableNameFromURL]);

  // Add item to menu via API
  const handleAddItemToMenu = async (newItem) => {
    try {
      const res = await axios.post(`${API_URL}/api/menu`, newItem, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMenu([...menu, res.data]);
      toast.success("Item added to menu via API!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add item via API");
    }
  };

  // Cart functions
  const handleAddToCart = async (item) => {
    try {
      const exists = cartItems.find((i) => i.id === item.id);
      let updatedCart;
      if (exists) {
        updatedCart = cartItems.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        updatedCart = [...cartItems, { ...item, quantity: 1, unit: "Full", kgQty: 1 }];
      }
      setCartItems(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));

      // Optionally sync with API
      await axios.post(`${API_URL}/api/cart`, { cart: updatedCart });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update cart");
    }
  };

  const handleUpdateQuantity = async (id, qty) => {
    const updatedCart = cartItems.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    await axios.post(`${API_URL}/api/cart`, { cart: updatedCart });
  };

  const handleRemoveItem = async (id) => {
    const updatedCart = cartItems.filter((i) => i.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    await axios.post(`${API_URL}/api/cart`, { cart: updatedCart });
  };

  const handleUnitChange = async (id, unit) => {
    const updatedCart = cartItems.map((i) => (i.id === id ? { ...i, unit } : i));
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    await axios.post(`${API_URL}/api/cart`, { cart: updatedCart });
  };

  const handleKgChange = async (id, kgQty) => {
    const updatedCart = cartItems.map((i) =>
      i.id === id ? { ...i, kgQty, quantity: kgQty } : i
    );
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    await axios.post(`${API_URL}/api/cart`, { cart: updatedCart });
  };

  const clearCart = async () => {
    setCartItems([]);
    localStorage.removeItem("cart");
    await axios.post(`${API_URL}/api/cart`, { cart: [] });
  };

  if (loading)
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (table === false)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        Table not found
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastProvider />
      <h1 className="p-5 text-2xl font-bold">Table: {table.table_name}</h1>

      {/* Admin Add Item Form */}
      <AddItemForm onAddItem={handleAddItemToMenu} />

      {/* Cart Sidebar */}
      {isCartOpen && (
        <CartSidebar
          isOpen={true}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onAdd={handleAddToCart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemoveItem}
          onUnitChange={handleUnitChange}
          onKgChange={handleKgChange}
          onClearCart={clearCart}
          menu={menu}
          tableName={table.table_name}
          selectedTable={table}
        />
      )}
    </div>
  );
}
