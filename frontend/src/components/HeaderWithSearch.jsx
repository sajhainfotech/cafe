"use client";
import { Plus } from "lucide-react";
import React from "react";

export default function HeaderWithSearch({
  title,
  searchValue,
  onSearchChange = () => {},
  buttonLabel,
  onButtonClick = () => {},
  showButton = true,
  placeholder,
}) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-2 mb-2">
      <h1 className="self-start text-left text-[15px] font-bold primary-color">
        {title}
      </h1>

      <div className="flex w-full md:w-auto items-center gap-2">
        <div className="relative">
          <svg
            className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#236B28]/60"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
            />
          </svg>

          <input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-2 border-[#236B28]/30 rounded-md pl-8 pr-3 py-1 text-[12px]
        focus:outline-none focus:ring-1 focus:ring-[#236B28]/40"
          />
        </div>

        <button
          onClick={onButtonClick}
          className="flex items-center gap-1  font-semibold
       rounded-md shadow-sm transition submit-button"
        >
          <Plus size={15} />
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
