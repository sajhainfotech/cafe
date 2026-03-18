"use client";
import React from "react";

export default function DeleteModal({
  branch,
  setShowDeleteModal,
  handleDeleteConfirmed,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-md w-[90%] max-w-sm p-4">
        <h2 className="text-lg font-bold text-red-600 mb-3">Confirm Delete</h2>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete{" "}
          <span className="font-semibold capitalize">{branch}</span>?
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={setShowDeleteModal}
            className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteConfirmed}
            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-sm cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
