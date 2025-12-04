"use client";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import CartSidebar from "@/components/CartSidebar";
import { menuItems } from "@/data/MenuData";
import ToastProvider from "@/components/ToastProvider";
import toast from "react-hot-toast";

const TableMenuPage = () => {
  const { tableId } = useParams();
  const [cartItems, setCartItems] = useState([]);
  const [menu, setMenu] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(true);
  const clearCart = () => setCartItems([]);

  const validTables = [1, 2, 3, 4, 5, 6];

  useEffect(() => {
    setMenu(menuItems);
  }, []);

  if (tableId && !validTables.includes(Number(tableId))) {
    return (
      <div className="p-10 text-center text-red-600 text-2xl">
        ❌ Table Number is not available
      </div>
    );
  }

  // const addToCart = (item) => {
  //   const exists = cartItems.find((c) => c.id === item.id);

  //   if (exists) {
  //     if (item.type === "kg") {
  //       setCartItems(
  //         cartItems.map((c) =>
  //           c.id === item.id
  //             ? { ...c, kgQty: (c.kgQty || 1) + 1, quantity: (c.quantity || 0) + 1 }
  //             : c
  //         )
  //       );
  //     } else {
  //       setCartItems(
  //         cartItems.map((c) =>
  //           c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
  //         )
  //       );
  //     }
  //   } else {
  //     if (item.type === "kg") {
  //       setCartItems([...cartItems, { ...item, kgQty: 1, quantity: 1 }]);
  //     } else if (item.type === "half_full") {
  //       setCartItems([...cartItems, { ...item, unit: "Full", quantity: 1 }]);
  //     } else {
  //       setCartItems([...cartItems, { ...item, quantity: 1 }]);
  //     }
  //   }
  // };


const addToCart = (item, unit = "Full") => {
  // Check if same item with same unit exists
  const exists = cartItems.find(
    (c) => c.id === item.id && (c.unit || "Full") === unit
  );

  if (exists) {
    // Increase quantity
    setCartItems(
      cartItems.map((c) =>
        c.id === item.id && (c.unit || "Full") === unit
          ? { ...c, quantity: c.quantity + 1 }
          : c
      )
    );
  } else {
    // Add new item
    if (item.type === "half_full") {
      setCartItems([...cartItems, { ...item, unit, quantity: 1 }]);
    } else if (item.type === "kg") {
      setCartItems([...cartItems, { ...item, kgQty: 1, quantity: 1 }]);
    } else {
      setCartItems([...cartItems, { ...item, quantity: 1 }]);
    }
  }
};



  const updateQty = (id, qty) => {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setCartItems(cartItems.map((c) => (c.id === id ? { ...c, quantity: qty } : c)));
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter((c) => c.id !== id));
    toast("✔️Item removed from your cart.")
  };

  const updateUnit = (id, unit) => {
    setCartItems(cartItems.map((c) => (c.id === id ? { ...c, unit } : c)));
  };

  const updateKg = (id, kgQty) => {
    setCartItems(cartItems.map((c) => (c.id === id ? { ...c, kgQty, quantity: kgQty } : c)));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastProvider />
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQty}
        onRemove={removeItem}
        onAdd={addToCart}
        onUnitChange={updateUnit}
        onKgChange={updateKg}
        menu={menu}
        tableId={tableId}
        onClearCart={clearCart}
      />
    </div>
  );
};

export default TableMenuPage;
