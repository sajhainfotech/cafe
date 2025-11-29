import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "./ui/scroll-area";

const CartSidebar = ({ isOpen, onClose, items, onUpdateQuantity, onRemove }) => {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);



  const placeOrder = () => {
  const order = {
    id: Date.now(),
    items,
    total,
    tableId: 1, // later dynamic banauna milcha
    time: new Date().toLocaleString(),
  };

  // Save to localStorage
  const existing = JSON.parse(localStorage.getItem("orders")) || [];
  existing.push(order);
  localStorage.setItem("orders", JSON.stringify(existing));

  alert("Order placed! Restaurant will receive it.");
  onClose();
};


  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-card shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Your Order</h2>
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                {items.length}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Cart Items */}
          <ScrollArea className="flex-1 p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add items from the menu to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-secondary/50 rounded-lg p-3 border border-border">
                    <div className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-foreground">{item.name}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -mt-1 -mr-1"
                            onClick={() => onRemove(item.id)}
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                        <p className="text-sm text-primary font-semibold mb-2">
                          ${item.price.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() =>
                              onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-semibold text-foreground w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer - only show if items exist */}
          {items.length > 0 && (
            <div className="p-4 border-t border-border bg-card">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
              </div>
              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white font-semibold py-6 text-lg shadow-lg"
               onClick={placeOrder}>
                Place Order
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;
