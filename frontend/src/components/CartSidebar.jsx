// "use client";

// import { X, Minus, Plus, ShoppingBag, CheckCircle } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { ScrollArea } from "./ui/scroll-area";
// import ToastProvider from "./ToastProvider";
// import { toast } from "react-hot-toast";

// const CartSidebar = ({
//   isOpen,
//   onClose,
//   items = [],
//   menu = [],
//   onUpdateQuantity,
//   onRemove,
//   tableName,
//   onAdd,
//   onUnitChange,
//   onKgChange,
//   onClearCart,
//   selectedTable,
// }) => {
//   // Calculate total
//   const total = items.reduce((sum, item) => {
//     if (item.type === "quantity_only") return sum + item.quantity * item.price;
//     if (item.type === "half_full")
//       return (
//         sum +
//         item.quantity * (item.unit === "Half" ? item.halfPrice : item.price)
//       );
//     if (item.type === "kg") return sum + (item.kgQty || 1) * item.pricePerKg;
//     return sum;
//   }, 0);

//   // Place order
//  // Place order function update
// const placeOrder = () => {
//   const total_price = items.reduce((sum, item) => {
//     if (item.type === "quantity_only") return sum + item.quantity * item.price;
//     if (item.type === "half_full")
//       return sum + item.quantity * (item.unit === "Half" ? item.halfPrice : item.price);
//     if (item.type === "kg") return sum + (item.kgQty || 1) * item.pricePerKg;
//     return sum;
//   }, 0);

//   const order = {
//     order_id: Date.now(),  // Use order_id instead of id
//     table_id: selectedTable.id,
//     tableName: selectedTable.table_name,
//     items: items.map((i) => ({
//       ...i,
//       unit: i.unit || "Full",
//       kgQty: i.kgQty || 1,
//     })),
//     total_price, // <-- save total_price here
//     status: "Pending",
//     created_at: new Date().toISOString(),
//   };

//   const existing = JSON.parse(localStorage.getItem("orders")) || [];
//   existing.push(order);
//   localStorage.setItem("orders", JSON.stringify(existing));

//   toast(`Order sent for Table ${tableName || "N/A"}!`, {
//     icon: <CheckCircle className="text-green-500" />,
//   });

//   onClearCart();
// };


//   return (
//     <>
//       <ToastProvider />
//       {isOpen && (
//         <div
//           className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
//           onClick={onClose}
//         />
//       )}

//       <div
//         className={`fixed top-0 right-0 h-full min-w-full md:w-[400px] bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-lg font-sans
//         ${isOpen ? "translate-x-0" : "translate-x-full"}`}
//       >
//         <div className="flex flex-col h-full">
//           {/* Header */}
//           <div className="flex flex-col border-b p-4 sticky top-0 bg-white z-10">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <ShoppingBag className="h-5 w-5 text-amber-500" />
//                 <h2 className="text-xl font-bold">Menu</h2>
//                 <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
//                   {items.length}
//                 </span>
//               </div>
//             </div>
//             {tableName && (
//               <p className="text-sm text-gray-500 mt-2">Table # {tableName}</p>
//             )}
//           </div>

//           {/* Menu Items */}
//           <ScrollArea className="flex-1 p-4 space-y-4 max-h-[calc(100vh-200px)]">
//             {menu.map((item) => {
//               const inCart = items.find((i) => i.id === item.id);
//               const quantity = inCart ? inCart.quantity : 0;
//               const unit = inCart ? inCart.unit : "Full";
//               const kgQty = inCart ? inCart.kgQty || 1 : 1;

//               return (
//                 <div
//                   key={item.id}
//                   className="border p-3 rounded-lg flex items-center gap-3"
//                 >
//                   <img
//                     src={item.image}
//                     alt={item.name}
//                     className="w-23 h-23 object-cover rounded "
//                   />
//                   <div className="flex-1">
//                     <h3 className="font-semibold text-sm md:text-base">
//                       {typeof item.name === "string"
//                         ? item.name
//                         : JSON.stringify(item.name)}
//                     </h3>
//                     <p className="text-xs md:text-sm text-gray-600">
//                       {item.description}
//                     </p>
//                     <p className="font-bold mt-1 text-sm md:text-base">
//                       Rs.{" "}
//                       {item.type === "kg"
//                         ? (kgQty * item.pricePerKg).toFixed(2)
//                         : item.type === "half_full"
//                         ? unit === "Half"
//                           ? item.halfPrice.toFixed(2)
//                           : item.price.toFixed(2)
//                         : item.price.toFixed(2)}
//                     </p>

//                     {/* Controls */}
//                     {item.type === "quantity_only" && (
//                       <div className="flex items-center gap-2 mt-2">
//                         <Button
//                           size="icon"
//                           variant="outline"
//                           className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
//                           onClick={() =>
//                             onUpdateQuantity(item.id, Math.max(0, quantity - 1))
//                           }
//                         >
//                           <Minus className="h-3 w-3 md:h-4 md:w-4" />
//                         </Button>
//                         <span className="font-semibold w-6 text-center">
//                           {quantity}
//                         </span>
//                         <Button
//                           size="icon"
//                           variant="outline"
//                           className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
//                           onClick={() => onAdd(item)}
//                         >
//                           <Plus className="h-3 w-3 md:h-4 md:w-4" />
//                         </Button>
//                         {quantity > 0 && (
//                           <Button
//                             size="icon"
//                             variant="ghost"
//                             onClick={() => onRemove(item.id)}
//                           >
//                             <X className="h-3 w-3 text-red-500 md:h-4 md:w-4" />
//                           </Button>
//                         )}
//                       </div>
//                     )}

//                     {item.type === "half_full" && (
//                       <>
//                         <div className="flex items-center gap-2 mt-1 text-xs md:text-sm">
//                           <label className="flex items-center gap-1">
//                             <input
//                               type="radio"
//                               name={`unit-${item.id}`}
//                               value="Full"
//                               checked={unit === "Full"}
//                               onChange={() => {
//                                 if (!inCart || quantity === 0) {
//                                   toast.error("Add item first");
//                                   return;
//                                 }
//                                 onUnitChange(item.id, "Full");
//                               }}
//                             />{" "}
//                             Full
//                           </label>
//                           <label className="flex items-center gap-1">
//                             <input
//                               type="radio"
//                               name={`unit-${item.id}`}
//                               value="Half"
//                               checked={unit === "Half"}
//                               onChange={() => {
//                                 if (!inCart || quantity === 0) {
//                                   toast.error(
//                                     "Add item first and select half or full!"
//                                   );
//                                   return;
//                                 }
//                                 onUnitChange(item.id, "Half");
//                               }}
//                             />{" "}
//                             Half
//                           </label>
//                         </div>
//                         <div className="flex items-center gap-2 mt-2">
//                           <Button
//                             size="icon"
//                             variant="outline"
//                             className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
//                             onClick={() =>
//                               onUpdateQuantity(
//                                 item.id,
//                                 Math.max(0, quantity - 1)
//                               )
//                             }
//                           >
//                             <Minus className="h-3 w-3 md:h-4 md:w-4" />
//                           </Button>
//                           <span className="font-semibold w-6 text-center">
//                             {quantity}
//                           </span>
//                           <Button
//                             size="icon"
//                             variant="outline"
//                             onClick={() => onAdd(item)}
//                             className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
//                           >
//                             <Plus className="h-3 w-3 md:h-4 md:w-4" />
//                           </Button>
//                           {quantity > 0 && (
//                             <Button
//                               size="icon"
//                               variant="ghost"
//                               onClick={() => onRemove(item.id)}
//                             >
//                               <X className="h-3 w-3 text-red-500 md:h-4 md:w-4" />
//                             </Button>
//                           )}
//                         </div>
//                       </>
//                     )}

//                     {item.type === "kg" && (
//                       <div className="flex items-center gap-2 mt-2">
//                         <select
//                           className="border border-amber-500 text-amber-700 px-2 py-1 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-amber-500"
//                           value={kgQty}
//                           onChange={(e) => {
//                             const selectedKg = parseFloat(e.target.value);
//                             if (!inCart || quantity === 0) {
//                               toast.error("Add item first!");
//                               return;
//                             }
//                             onKgChange(item.id, selectedKg);
//                           }}
//                         >
//                           <option value={0.5}>0.5 kg</option>
//                           <option value={1}>1 kg</option>
//                           <option value={1.5}>1.5 kg</option>
//                           <option value={2}>2 kg</option>
//                           <option value={2.5}>2.5 kg</option>
//                         </select>

//                         <Button
//                           size="icon"
//                           variant="outline"
//                           className="border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white"
//                           onClick={() => onAdd(item)}
//                         >
//                           <Plus className="h-3 w-3 md:h-4 md:w-4" />
//                         </Button>

//                         {quantity > 0 && (
//                           <Button
//                             size="icon"
//                             variant="outline"
//                             className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
//                             onClick={() => onRemove(item.id)}
//                           >
//                             <X className="h-3 w-3 md:h-4 md:w-4" />
//                           </Button>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               );
//             })}
//           </ScrollArea>

//           {/* Footer */}
//           {items.length > 0 && (
//             <div className="p-4 border-t flex flex-col gap-3 sticky bottom-0 bg-amber-100 z-10 shadow-lg rounded-t-4xl">
//               <div className="flex justify-between items-center">
//                 <div className="flex flex-col">
//                   <span className="text-gray-500 text-sm md:text-base">
//                     Total Items
//                   </span>
//                   <span className="font-semibold text-lg md:text-xl">
//                     {items.length} items
//                   </span>
//                 </div>
//                 <div className="flex flex-col text-right">
//                   <span className="text-gray-500 text-sm md:text-base">
//                     Total Price
//                   </span>
//                   <span className="font-bold text-xl md:text-2xl text-amber-600">
//                     Rs. {total.toFixed(2)}
//                   </span>
//                 </div>
//               </div>
//               <Button
//                 className="w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 transition-colors font-semibold shadow-md"
//                 onClick={placeOrder}
//               >
//                 Place Order
//               </Button>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// };

// export default CartSidebar;

"use client";

import React, { useState } from "react";
import { X, Minus, Plus, ShoppingBag, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "./ui/scroll-area";
import ToastProvider from "./ToastProvider";
import { toast } from "react-hot-toast";
import axios from "axios";

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

const CartSidebar = ({
  isOpen,
  onClose,
  items = [],
  onAdd,
  onUpdateQuantity,
  onRemove,
  onUnitChange,
  onKgChange,
  onClearCart,
  selectedTable,
}) => {
  const [placingOrder, setPlacingOrder] = useState(false);

  // Total price calculation
  const totalPrice = items.reduce((sum, item) => {
    if (item.type === "quantity_only") return sum + item.quantity * item.price;
    if (item.type === "half_full")
      return sum + item.quantity * (item.unit === "Half" ? item.halfPrice : item.price);
    if (item.type === "kg") return sum + (item.kgQty || 1) * item.pricePerKg;
    return sum;
  }, 0);

  // Place order via API
  const placeOrder = async () => {
    if (!selectedTable) {
      toast.error("Please select a table before placing order!");
      return;
    }
    if (items.length === 0) {
      toast.error("Cart is empty!");
      return;
    }

    const order = {
      table_id: selectedTable.id,
      tableName: selectedTable.table_name,
      items: items.map((i) => ({
        item_id: i.id,
        name: i.name,
        unit: i.unit || "Full",
        kgQty: i.kgQty || 1,
        quantity: i.quantity,
        price: i.price,
        halfPrice: i.halfPrice,
        pricePerKg: i.pricePerKg,
        type: i.type,
      })),
      total_price: totalPrice,
      status: "Pending",
      created_at: new Date().toISOString(),
    };

    try {
      setPlacingOrder(true);
      const res = await axios.post(`${API_URL}/api/orders`, order);
      toast.success(`Order placed for Table ${selectedTable.table_name}!`, {
        icon: <CheckCircle className="text-green-500" />,
      });
      onClearCart();
    } catch (err) {
      console.error(err);
      toast.error("Failed to place order via API!");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <>
      <ToastProvider />
      {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />}
      <div
        className={`fixed top-0 right-0 h-full min-w-full md:w-[400px] bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-lg ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex flex-col border-b p-4 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold">Cart</h2>
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">{items.length}</span>
            </div>
            {selectedTable && <p className="text-sm text-gray-500 mt-2">Table # {selectedTable.table_name}</p>}
          </div>

          {/* Cart Items */}
          <ScrollArea className="flex-1 p-4 space-y-4 max-h-[calc(100vh-200px)]">
            {items.map((item) => {
              const quantity = item.quantity;
              const unit = item.unit || "Full";
              const kgQty = item.kgQty || 1;

              return (
                <div key={item.id} className="border p-3 rounded-lg flex items-center gap-3">
                  {item.image && <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />}
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <p className="font-bold mt-1">
                      Rs.{" "}
                      {item.type === "kg"
                        ? (kgQty * item.pricePerKg).toFixed(2)
                        : item.type === "half_full"
                        ? unit === "Half"
                          ? item.halfPrice.toFixed(2)
                          : item.price.toFixed(2)
                        : item.price.toFixed(2)}
                    </p>

                    {/* Controls */}
                    {item.type === "quantity_only" && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="icon" onClick={() => onUpdateQuantity(item.id, Math.max(0, quantity - 1))}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center">{quantity}</span>
                        <Button size="icon" onClick={() => onAdd(item)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        {quantity > 0 && (
                          <Button size="icon" onClick={() => onRemove(item.id)}>
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    )}

                    {item.type === "half_full" && (
                      <div className="mt-2 flex items-center gap-2">
                        <label>
                          <input type="radio" checked={unit === "Full"} onChange={() => onUnitChange(item.id, "Full")} /> Full
                        </label>
                        <label>
                          <input type="radio" checked={unit === "Half"} onChange={() => onUnitChange(item.id, "Half")} /> Half
                        </label>
                        <Button size="icon" onClick={() => onUpdateQuantity(item.id, Math.max(0, quantity - 1))}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center">{quantity}</span>
                        <Button size="icon" onClick={() => onAdd(item)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button size="icon" onClick={() => onRemove(item.id)}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}

                    {item.type === "kg" && (
                      <div className="mt-2 flex items-center gap-2">
                        <select
                          value={kgQty}
                          onChange={(e) => onKgChange(item.id, parseFloat(e.target.value))}
                          className="border px-2 py-1 rounded"
                        >
                          {[0.5, 1, 1.5, 2, 2.5].map((v) => (
                            <option key={v} value={v}>
                              {v} kg
                            </option>
                          ))}
                        </select>
                        <Button size="icon" onClick={() => onAdd(item)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button size="icon" onClick={() => onRemove(item.id)}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </ScrollArea>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-4 border-t bg-amber-100 sticky bottom-0 flex flex-col gap-2">
              <div className="flex justify-between">
                <span>Total Items: {items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                <span>Total Price: Rs. {totalPrice.toFixed(2)}</span>
              </div>
              <Button
                className={`w-full bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 ${
                  placingOrder ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={placeOrder}
                disabled={placingOrder}
              >
                {placingOrder ? "Placing Order..." : "Place Order"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;
