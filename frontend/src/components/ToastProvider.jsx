"use client";

import { Toaster } from "react-hot-toast";

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#FEF3C7",
          color: "#92400E",
          border: "1px solid #FCD34D",
          padding: "6px 12px",
          borderRadius: "8px",
          fontSize: "14px",
          lineHeight: "1.2",
          minHeight: "auto",
        },

        success: {
          style: {
            background: "#ECFDF5",
            color: "#065F46",
            border: "1px solid #34D399",
            padding: "6px 12px",
            lineHeight: "1.2",
            minHeight: "auto",
          },
        },

        error: {
          style: {
            background: "#FEF2F2",
            color: "#B91C1C",
            border: "1px solid #F87171",
            padding: "6px 12px",
            lineHeight: "1.2",
            minHeight: "auto",
          },
        },
      }}
    />
  );
};

export default ToastProvider;
