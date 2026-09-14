import React from 'react';
import { Info, CheckCircle2, AlertCircle, X } from 'lucide-react';

export function Toast({ toast, onClose }) {
  if (!toast || !toast.message) return null;

  const styles = {
    info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800",
    error: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/80 dark:text-red-200 dark:border-red-800"
  };

  const icons = {
    info: <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
  };

  return (
    <div className={`mb-6 p-3.5 px-4 rounded-xl text-xs sm:text-sm font-medium border shadow-sm transition-all duration-300 flex items-center justify-between gap-3 ${styles[toast.type] || styles.info}`}>
      <div className="flex items-center gap-2">
        {icons[toast.type] || icons.info}
        <span>{toast.message}</span>
      </div>
      <button onClick={onClose} className="opacity-70 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
