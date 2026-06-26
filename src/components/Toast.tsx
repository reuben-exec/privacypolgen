// src/components/Toast.tsx
import { useEffect, useRef, useState } from 'react';

export function Toast({ message, onDone, duration = 2000, type = 'success' }: {
  message: string;
  onDone: () => void;
  duration?: number;
  type?: 'success' | 'error';
}) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    const t = setTimeout(() => onDoneRef.current(), duration);
    return () => clearTimeout(t);
  }, [duration]);
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-toast rounded-button border border-border bg-bg-elevated/95 backdrop-blur px-4 py-2.5 text-sm shadow-lg"
    >
      <div className="flex items-center gap-2">
        {type === 'error' ? (
          <svg className="h-4 w-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6M9 9l6 6" />
          </svg>
        ) : (
          <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12l5 5L20 7" />
          </svg>
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  return {
    message: toast?.message ?? null,
    show: (m: string, type?: 'success' | 'error') => setToast({ message: m, type: type ?? 'success' }),
    clear: () => setToast(null),
    element: toast ? (
      <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
    ) : null,
  };
}
