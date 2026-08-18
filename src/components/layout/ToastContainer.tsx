"use client";

import React from "react";
import { ToastMessage } from "@/models/toast.model";

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl glass-panel shadow-lg border-l-4 transition-all duration-300 ${
            toast.type === "success"
              ? "border-emerald-500 text-slate-800 dark:text-slate-100"
              : toast.type === "error"
              ? "border-rose-500 text-slate-800 dark:text-slate-100"
              : "border-brand-500 text-slate-800 dark:text-slate-100"
          }`}
        >
          <i
            className={`fa-solid text-sm ${
              toast.type === "success"
                ? "fa-circle-check text-emerald-500"
                : toast.type === "error"
                ? "fa-circle-xmark text-rose-500"
                : "fa-circle-info text-brand-500"
            }`}
          ></i>
          <span className="text-xs font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
