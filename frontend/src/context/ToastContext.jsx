import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = useCallback(({ type = "info", title, message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  const success = useCallback((title, message) => toast({ type: "success", title, message }), [toast]);
  const error   = useCallback((title, message) => toast({ type: "error",   title, message, duration: 6000 }), [toast]);
  const info    = useCallback((title, message) => toast({ type: "info",    title, message }), [toast]);
  const warning = useCallback((title, message) => toast({ type: "warning", title, message }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

const TOAST_STYLES = {
  success: { bg: "#f0fdf4", border: "#86efac", icon: "✅", accent: "#16a34a", titleColor: "#14532d" },
  error:   { bg: "#fef2f2", border: "#fca5a5", icon: "❌", accent: "#dc2626", titleColor: "#7f1d1d" },
  warning: { bg: "#fffbeb", border: "#fde68a", icon: "⚠️", accent: "#d97706", titleColor: "#78350f" },
  info:    { bg: "#eff6ff", border: "#93c5fd", icon: "ℹ️", accent: "#2563eb", titleColor: "#1e3a8a" },
};

function ToastItem({ toast, onDismiss }) {
  const s = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
  return (
    <div className="toast-item" style={{ background: s.bg, borderLeft: `4px solid ${s.accent}`, borderTop: `1px solid ${s.border}`, borderRight: `1px solid ${s.border}`, borderBottom: `1px solid ${s.border}` }}>
      <span className="toast-icon">{s.icon}</span>
      <div className="toast-body">
        {toast.title && <div className="toast-title" style={{ color: s.titleColor }}>{toast.title}</div>}
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>
      <button className="toast-close" onClick={() => onDismiss(toast.id)}>×</button>
    </div>
  );
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
