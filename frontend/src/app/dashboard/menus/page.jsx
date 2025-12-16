"use client";
import React from "react";

import AddItemForm from "@/components/AddItemForm";
import AdminHeader from "../AdminHeader";

export default function MenuManagement() {
  const handleAddItem = (item) => {
    setMenuItems([...menuItems, item]);
  };

  return (
    <>
      <div className="min-h-screen">
        {/* header */}
        <AdminHeader />
        <div className="p-6">
          <AddItemForm onAddItem={handleAddItem} />
        </div>
      </div>
    </>
  );
}
