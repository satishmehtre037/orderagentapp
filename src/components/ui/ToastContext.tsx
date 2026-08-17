'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, MessageSquare, X, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'whatsapp';

interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

interface ToastContextValue {
  showToast: (options: ToastOptions | string, type?: ToastType) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
  showConfirm: async () => false,
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<(ToastOptions & { id: number }) | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const dismissToast = useCallback(() => {
    setIsExiting(true);
    if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    if (autoHideTimeoutRef.current) clearTimeout(autoHideTimeoutRef.current);

    dismissTimeoutRef.current = setTimeout(() => {
      setToast(null);
      setIsExiting(false);
    }, 320);
  }, []);

  const showToast = useCallback((options: ToastOptions | string, type: ToastType = 'info') => {
    if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    if (autoHideTimeoutRef.current) clearTimeout(autoHideTimeoutRef.current);

    const toastData: ToastOptions = typeof options === 'string'
      ? { message: options, type }
      : { type: 'info', ...options };

    const id = Date.now();
    setIsExiting(false);
    setToast({ ...toastData, id });

    autoHideTimeoutRef.current = setTimeout(() => {
      dismissToast();
    }, toastData.duration || 4000);
  }, [dismissToast]);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({ options, resolve });
    });
  }, []);

  const handleConfirmAction = (result: boolean) => {
    if (confirmDialog) {
      confirmDialog.resolve(result);
      setConfirmDialog(null);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* 1. Apple iPhone Dynamic Island / Frosted Glass Push Toast Notification */}
      {toast && (
        <div className="fixed top-3 sm:top-4 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none">
          <div
            onClick={dismissToast}
            className={`pointer-events-auto cursor-pointer w-full max-w-sm sm:max-w-md rounded-3xl backdrop-blur-3xl bg-slate-900/95 text-white border border-white/20 p-4 flex items-start space-x-3.5 select-none transition-all duration-300 transform ${
              isExiting
                ? '-translate-y-16 opacity-0 scale-95 pointer-events-none ease-in'
                : 'translate-y-0 opacity-100 scale-100 ease-out active:scale-98'
            }`}
            style={{
              boxShadow: '0 28px 60px -12px rgba(0, 0, 0, 0.65), inset 0 1px 2px 0 rgba(255, 255, 255, 0.3)',
              transitionTimingFunction: isExiting ? 'cubic-bezier(0.4, 0, 1, 1)' : 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Notification App Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'whatsapp' ? (
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                  <MessageSquare className="w-4 h-4" />
                </div>
              ) : toast.type === 'success' ? (
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/25 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : toast.type === 'error' ? (
                <div className="w-9 h-9 rounded-2xl bg-rose-500/25 border border-rose-400/40 flex items-center justify-center text-rose-400 shadow-inner">
                  <AlertCircle className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-indigo-400 shadow-inner">
                  <Info className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Notification Text Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
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

            {/* Dismiss Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast();
              }}
              className="text-slate-400 hover:text-white p-1 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Apple iOS Frosted Glass Confirmation Alert Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm rounded-[28px] backdrop-blur-3xl bg-slate-900/95 text-white border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.6)] p-6 space-y-4 text-center transform scale-100 transition-all select-none"
            style={{
              boxShadow: '0 32px 64px -16px rgba(0, 0, 0, 0.6), inset 0 1px 2px 0 rgba(255, 255, 255, 0.25)',
            }}
          >
            {/* Dialog Icon */}
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>

            {/* Title & Body */}
            <div className="space-y-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {confirmDialog.options.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal px-1">
                {confirmDialog.options.message}
              </p>
            </div>

            {/* iOS Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleConfirmAction(false)}
                className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-slate-200 hover:text-white text-xs font-bold transition-all active:scale-98 border border-white/10 shadow-sm"
              >
                {confirmDialog.options.cancelText || 'Cancel'}
              </button>
              <button
                onClick={() => handleConfirmAction(true)}
                className={`w-full py-3 px-4 rounded-2xl text-xs font-bold text-white transition-all active:scale-98 shadow-md ${
                  confirmDialog.options.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                {confirmDialog.options.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
