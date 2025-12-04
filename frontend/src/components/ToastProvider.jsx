'use client';

import { Toaster } from "react-hot-toast";

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // Default Amber Theme
        style: {
          background: "#FEF3C7",  
          color: "#92400E",         
          border: "1px solid #FCD34D",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "14px",
        },

        // Success Toast - Green
        success: {
          style: {
            background: "#ECFDF5",
            color: "#065F46",
            border: "1px solid #34D399",
          },
        },

        // Error Toast - Red
        error: {
          style: {
            background: "#FEF2F2",
            color: "#B91C1C",
            border: "1px solid #F87171",
          },
        }
      }}
    />
  );
};

export default ToastProvider;
