import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    Icon: CheckCircle2,
    iconClass: 'text-green-500',
    border: 'border-l-green-500',
    bar: 'bg-green-500',
  },
  error: {
    Icon: XCircle,
    iconClass: 'text-red-500',
    border: 'border-l-red-500',
    bar: 'bg-red-500',
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: 'text-orange-500',
    border: 'border-l-orange-500',
    bar: 'bg-orange-500',
  },
  info: {
    Icon: Info,
    iconClass: 'text-blue-500',
    border: 'border-l-blue-500',
    bar: 'bg-blue-500',
  },
};

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const v = VARIANTS[toast.type] ?? VARIANTS.info;
  const { Icon } = v;
  const duration = toast.duration ?? 4000;

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  }, [toast.id, onRemove]);

  useEffect(() => {
    const t = setTimeout(dismiss, duration);
    return () => clearTimeout(t);
  }, [dismiss, duration]);

  return (
    <div
      onClick={dismiss}
      className={`relative flex items-start gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 border-l-4 ${v.border} rounded-xl px-4 py-3.5 shadow-xl shadow-zinc-900/10 dark:shadow-black/50 w-[340px] overflow-hidden cursor-pointer select-none ${exiting ? 'animate-toast-out' : 'animate-toast-in'}`}
    >
      <Icon size={18} className={`${v.iconClass} shrink-0 mt-0.5`} />
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={e => { e.stopPropagation(); dismiss(); }}
        className="shrink-0 mt-0.5 p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors duration-150"
      >
        <X size={14} />
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full ${v.bar} opacity-50`}
          style={{ animation: `progress-bar ${duration}ms linear forwards` }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[300] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
