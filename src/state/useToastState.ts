"use client";

import { useState, useCallback } from "react";
import { ToastMessage, ToastType } from "@/models/toast.model";

export function useToastState() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    const newToast: ToastMessage = { id, message, type, visible: true };
    
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return {
    toasts,
    showToast,
  };
}
