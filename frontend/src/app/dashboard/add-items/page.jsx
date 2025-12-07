"use client";
import React from "react";

import AddItemForm from "@/components/AddItemForm";

export default function MenuManagement() {
  const handleAddItem = (item) => {
    setMenuItems([...menuItems, item]);
  };

  return (
    <div className="p-6">
      <AddItemForm onAddItem={handleAddItem} />
    </div>
  );
}
