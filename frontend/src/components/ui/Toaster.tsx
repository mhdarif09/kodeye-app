"use client";

import { Toaster as ReactHotToaster } from "react-hot-toast";

export const Toaster = () => {
  return (
    <ReactHotToaster
      position="bottom-right"
      toastOptions={{
        className: "",
        style: {
          background: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          fontSize: "14px",
          borderRadius: "6px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
        },
        success: {
          iconTheme: {
            primary: "#10b981",
            secondary: "var(--background)",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "var(--background)",
          },
        },
      }}
    />
  );
};
