"use client";

import { Toaster } from "react-hot-toast";

/**
 * Mounted exactly once, in the root layout. It used to be mounted in the
 * dashboard layout AND again inside individual pages, which produced duplicate
 * toasts on every action.
 */
export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 3000,
        style: {
          background: "#ffffff",
          color: "var(--color-ink-800)",
          border: "1px solid var(--color-ink-200)",
          borderRadius: "10px",
          boxShadow: "var(--shadow-pop)",
          padding: "10px 14px",
          fontSize: "0.8125rem",
          fontWeight: 500,
          maxWidth: "22rem",
        },
        success: {
          iconTheme: {
            primary: "var(--color-success-600)",
            secondary: "#ffffff",
          },
          style: { borderColor: "var(--color-success-200)" },
        },
        error: {
          duration: 4500,
          iconTheme: {
            primary: "var(--color-danger-600)",
            secondary: "#ffffff",
          },
          style: { borderColor: "var(--color-danger-200)" },
        },
      }}
    />
  );
}
