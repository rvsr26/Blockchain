import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";
export interface Toast { id: string; type: ToastType; title: string; message?: string; }

let toastListeners: ((t: Toast) => void)[] = [];
export function showToast(toast: Omit<Toast, "id">) {
  const t = { ...toast, id: Math.random().toString(36).slice(2) };
  toastListeners.forEach((l) => l(t));
}
export const toast = {
  success: (title: string, message?: string) => showToast({ type: "success", title, message }),
  error: (title: string, message?: string) => showToast({ type: "error", title, message }),
  warning: (title: string, message?: string) => showToast({ type: "warning", title, message }),
  info: (title: string, message?: string) => showToast({ type: "info", title, message }),
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, []);

  const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle, info: Info };
  const colors = {
    success: "border-green-500/30 bg-green-500/10 text-green-400",
    error: "border-red-500/30 bg-red-500/10 text-red-400",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    info: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  };
  const Icon = icons[toast.type];

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border glass-card animate-slide-up min-w-72 max-w-sm ${colors[toast.type]}`}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-white">{toast.title}</p>
        {toast.message && <p className="text-xs text-[#94a3b8] mt-0.5">{toast.message}</p>}
      </div>
      <button onClick={onDismiss} className="text-[#475569] hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const listener = (t: Toast) => setToasts((prev) => [...prev.slice(-4), t]);
    toastListeners.push(listener);
    return () => { toastListeners = toastListeners.filter((l) => l !== listener); };
  }, []);
  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />)}
    </div>
  );
}
