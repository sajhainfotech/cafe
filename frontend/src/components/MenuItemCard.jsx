"use client";

import { Card } from "@/components/ui/card";

const MenuItemCard = ({ item, onAdd }) => {
  return (
    <div className="group relative">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-300 to-orange-200 opacity-0 group-hover:opacity-50 blur-xl transition-all duration-100"></div>

      <Card
        className="
          relative 
          rounded-3xl overflow-hidden
          bg-white/70 backdrop-blur-xl
          border border-gray-200 shadow-md
          hover:shadow-2xl hover:-translate-y-2
          transition-all duration-300
        "
      >
        {/* Image Section */}
        <div className="relative h-40 w-full overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="
              w-full h-full object-cover
              transition-all duration-700
              group-hover:scale-110 group-hover:brightness-90
            "
          />

          {/* Floating Price Tag */}
          <div
            className="
            absolute top-1 left-3
            bg-black/50 text-white
            px-4 py-1 rounded-full text-sm font-semibold
            backdrop-blur-xl border border-white/20
          "
          >
            Rs. {item.price}
          </div>
        </div>

        {/* Content */}
        <div className="p-3 ">
          <h2 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition">
            {item.name}
          </h2>

          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-4">
            {item.description}
          </p>

          <div className="flex justify-between items-center">
            {/* Category */}
            <span
              className="
                text-xs font-medium
                px-3 py-1 rounded-full
                bg-gray-100 text-gray-700
                border border-gray-300
                transition-all
              "
            >
              {item.category}
            </span>

            <button
              onClick={() => onAdd(item)}
              className="
                text-sm font-semibold text-orange-700
                hover:text-orange-900 hover:underline
                transition
              "
            >
              Order Now →
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MenuItemCard;
