import React, { useEffect } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage, removeToast: (id: string) => void }> = ({ toast, removeToast }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <Check size={16} className="text-green-500" />;
      case 'error': return <AlertCircle size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="bg-white border border-alabaster-vein shadow-menu rounded-lg p-3 flex items-center gap-3 min-w-[300px] animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-auto">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-alabaster-haze border border-alabaster-vein shrink-0`}>
        {getIcon()}
      </div>
      <span className="text-sm text-surgical-steel font-medium flex-grow">{toast.message}</span>
      <button 
        onClick={() => removeToast(toast.id)}
        className="text-surgical-dim hover:text-surgical-steel hover:bg-alabaster-vein p-1 rounded transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};