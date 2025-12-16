"use client";
import React from "react";

import AddItemForm from "@/components/AddItemForm";

export default function MenuManagement() {
  const handleAddItem = (item) => {
    setMenuItems([...menuItems, item]);
  };

  return (
    <div >
      <AddItemForm onAddItem={handleAddItem} />
    </div>
  );
}
