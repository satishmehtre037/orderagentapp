'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, MessageSquare, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'whatsapp';

interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (options: ToastOptions | string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);

  const showToast = useCallback((options: ToastOptions | string, type: ToastType = 'info') => {
    const toastData: ToastOptions = typeof options === 'string'
      ? { message: options, type }
      : { type: 'info', ...options };

    const id = Date.now();
    setToast({ ...toastData, id });

    const timeout = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, toastData.duration || 3800);

    return () => clearTimeout(timeout);
  }, []);

  const dismiss = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* iPhone Glassmorphic Push Notification Banner */}
      {toast && (
        <div className="fixed top-4 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-6 duration-300">
          <div
            onClick={dismiss}
            className="pointer-events-auto cursor-pointer w-full max-w-sm sm:max-w-md rounded-2xl backdrop-blur-2xl bg-slate-900/88 text-white border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.35)] p-3.5 flex items-start space-x-3 transition-all transform active:scale-98 select-none"
            style={{
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
            }}
          >
            {/* Notification App Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'whatsapp' ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
              ) : toast.type === 'success' ? (
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : toast.type === 'error' ? (
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                  <Info className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Notification Text Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                  {toast.type === 'whatsapp' ? 'WhatsApp Business' : 'Agento AI'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">now</span>
              </div>
              {toast.title && (
                <h4 className="text-xs font-bold text-white mt-0.5 leading-tight truncate">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-medium">
                {toast.message}
              </p>
            </div>

            {/* Dismiss Cross */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismiss();
              }}
              className="text-slate-400 hover:text-white p-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
