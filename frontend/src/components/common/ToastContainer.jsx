import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, X } from 'lucide-react';

const TOAST_DURATION = 4000;

const TOAST_STYLES = {
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />,
    text: 'text-red-700',
    close: 'text-red-400 hover:text-red-600',
  },
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    icon: <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />,
    text: 'text-emerald-700',
    close: 'text-emerald-400 hover:text-emerald-600',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />,
    text: 'text-amber-700',
    close: 'text-amber-400 hover:text-amber-600',
  },
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const { message, type = 'error' } = e.detail || {};
      if (!message) return;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
      setTimeout(() => removeToast(id), TOAST_DURATION);
    };
    window.addEventListener('app:toast', handler);
    return () => window.removeEventListener('app:toast', handler);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const s = TOAST_STYLES[toast.type] || TOAST_STYLES.error;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${s.bg} animate-slide-up`}
          >
            {s.icon}
            <p className={`text-sm flex-1 ${s.text}`}>{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className={`${s.close} transition-colors`}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
