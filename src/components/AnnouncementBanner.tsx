// src/components/AnnouncementBanner.tsx
// Dismissible announcement banner — shows once per visitor until dismissed.

import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'ppg-banner-dismissed';

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed !== 'true') setVisible(true);
    } catch {
      // localStorage unavailable — don't show banner
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch { /* ignore */ }
  }

  return (
    <div className="relative bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white px-4 py-2.5 text-sm">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
        <p className="flex-1 text-center">
          <span className="font-semibold">✅ Maintenance complete!</span>{' '}
          We're back online with PDF/DOCX exports, cookie consent banner generator, and more.
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="shrink-0 rounded-button p-1 hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
