// src/components/Toast.tsx
import { useEffect, useState } from 'react';

export function Toast({ message, onDone, duration = 2000 }: {
  message: string;
  onDone: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-button border border-border bg-bg-elevated/95 backdrop-blur px-4 py-2.5 text-sm shadow-lg"
    >
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12l5 5L20 7" />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  return {
    message,
    show: (m: string) => setMessage(m),
    clear: () => setMessage(null),
    element: message ? (
      <Toast message={message} onDone={() => setMessage(null)} />
    ) : null,
  };
}
