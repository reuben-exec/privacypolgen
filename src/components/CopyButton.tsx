// src/components/CopyButton.tsx
import { useState } from 'react';
import { useI18n } from '@/lib/I18nProvider';

export function CopyButton({ value, label = 'Copy', className }: {
  value: string;
  label?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback: select + execCommand
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* ignore */ }
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={className ?? 'inline-flex h-8 items-center rounded-button border border-border bg-bg-elevated px-3 text-xs font-medium text-fg hover:bg-bg-card transition-colors'}
    >
      {copied ? (
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7" /></svg>
          {t('policyView.copied')}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          {label}
        </span>
      )}
    </button>
  );
}
