'use client';

import React, { useEffect } from 'react';
import { Spinner } from './Loader';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={() => {
        if (!loading) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="glass glass-glow p-6 sm:p-7 rounded-2xl border border-white/10 shadow-2xl max-w-md w-full relative overflow-hidden space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient background glow */}
        <div
          className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl pointer-events-none ${
            isDanger ? 'bg-rose-500/15' : isWarning ? 'bg-amber-500/15' : 'bg-primary/15'
          }`}
        />

        <div className="flex items-start gap-4">
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isDanger
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : isWarning
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-primary/10 border-primary/20 text-primary'
            }`}
          >
            {isDanger || isWarning ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <div className="space-y-1.5 min-w-0 flex-1">
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed break-words">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
              isDanger
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 hover:opacity-90 shadow-rose-500/20'
                : isWarning
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:opacity-90 shadow-amber-500/20'
                : 'bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 shadow-primary/20'
            }`}
          >
            {loading && <Spinner className="h-3.5 w-3.5 border-white" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
