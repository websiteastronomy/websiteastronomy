"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  toastSuccess: (message: string) => void;
  toastError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
  toastSuccess: () => {},
  toastError: () => {},
});

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 220);
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 3500);
    },
    [removeToast],
  );

  const toastSuccess = useCallback((message: string) => addToast(message, "success"), [addToast]);
  const toastError = useCallback((message: string) => addToast(message, "error"), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, toastSuccess, toastError }}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`toast-item toast-${t.type}${t.exiting ? " toast-exit" : ""}`}
              onClick={() => removeToast(t.id)}
              style={{ cursor: "pointer" }}
            >
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{ICONS[t.type]}</span>
              {t.message}
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
