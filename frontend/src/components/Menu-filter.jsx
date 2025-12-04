"use client";
import React, { useState } from "react";
import MenuItemCard from "./MenuItemCard";


const Menufilter = ({ menu, onAdd }) => {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...new Set(menu.map((item) => item.category))];

  const filteredMenu =
    activeCategory === "All"
      ? menu
      : menu.filter((item) => item.category === activeCategory);

  return (
    <div className="w-full">

      {/* FILTER BUTTONS */}
      <div className="flex gap-3 mb-6 overflow-x-auto py-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all
              ${activeCategory === cat
                ? "bg-amber-500 text-white border-amber-600"
                : "bg-white text-gray-700 border-gray-300"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FILTERED ITEMS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenu.map((item) => (
          <MenuItemCard key={item.id} item={item} onAdd={onAdd} />
        ))}
      </div>
    </div>
  );
};

export default Menufilter;
