"use client";

import AddItemForm from "@/components/AddItemForm";

/**
 * AddItemForm owns the whole menu screen — list, create and edit. This page is
 * just the route.
 *
 * It previously passed an onAddItem handler that called an undefined
 * setMenuItems, which would have thrown the moment it fired.
 */
export default function MenuManagement() {
  return <AddItemForm />;
}
