// src/components/PolicyView.tsx
import { useState, useEffect } from 'react';
import type { GeneratedPolicy } from '@/lib/generator';
import { CopyButton } from '@/components/CopyButton';
import { useI18n } from '@/lib/I18nProvider';
import { useToast } from '@/components/Toast';
import { buildExportOverrides } from '@/lib/buildOverrides';
import { EXPORT_LANGUAGES, translateMarkdown } from '@/lib/translate';
import { PremiumGate, usePremiumGate } from '@/components/PremiumGate';

function useTheme(): 'dark' | 'light' {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    const update = () => {
      const t = document.documentElement.getAttribute('data-theme');
      setTheme(t === 'light' ? 'light' : 'dark');
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

type Format = 'markdown' | 'html' | 'plain';

export function PolicyView({ policy }: { policy: GeneratedPolicy }) {
  const { t, locale } = useI18n();
  const [format, setFormat] = useState<Format>('markdown');
  const [exportLang, setExportLang] = useState('en');
  const [translating, setTranslating] = useState(false);
  const theme = useTheme();
  const toast = useToast();
  const { premium, mounted: premiumMounted, checkPremium } = usePremiumGate();

  const value =
    format === 'markdown' ? policy.markdown :
    format === 'html' ? policy.html :
    policy.plainText;

  const prettyHtml = useSafeHtml(policy.html, theme, locale);
  const formatLabel = t(`policyView.tabs.${format}`);

  const handlePdfDownload = async () => {
    if (premiumMounted && !checkPremium()) return;
    try {
      const { exportPdf } = await import('@/lib/export');
      let md = policy.markdown;
      if (exportLang !== 'en') {
        setTranslating(true);
        md = await translateMarkdown(policy.markdown, exportLang);
        setTranslating(false);
      }
      await exportPdf({ ...policy, markdown: md }, { ...buildExportOverrides(t), language: exportLang });
    } catch (err) {
      setTranslating(false);
      console.error('PDF download failed:', err);
      toast.show('PDF export failed: ' + (err instanceof Error ? err.message : String(err)), 'error');
    }
  };

  const handleDocxDownload = async () => {
    if (premiumMounted && !checkPremium()) return;
    try {
      const { exportDocx } = await import('@/lib/export');
      let md = policy.markdown;
      if (exportLang !== 'en') {
        setTranslating(true);
        md = await translateMarkdown(policy.markdown, exportLang);
        setTranslating(false);
      }
      await exportDocx({ ...policy, markdown: md }, { ...buildExportOverrides(t), language: exportLang });
    } catch (err) {
      setTranslating(false);
      console.error('DOCX download failed:', err);
      toast.show('DOCX export failed: ' + (err instanceof Error ? err.message : String(err)), 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex rounded-button border border-border bg-bg-elevated p-0.5 text-xs">
          {(['markdown', 'html', 'plain'] as Format[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={[
                'px-3 py-1.5 rounded font-medium uppercase tracking-wider transition-colors',
                format === f ? 'bg-bg-card text-fg' : 'text-fg-muted hover:text-fg',
              ].join(' ')}
            >
              {t(`policyView.tabs.${f}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {/* Language selector for export */}
          <div className="relative">
            <select
              value={exportLang}
              onChange={(e) => setExportLang(e.target.value)}
              disabled={translating}
              className="h-8 appearance-none rounded-button border border-border bg-bg-elevated pl-2.5 pr-7 text-xs font-medium text-fg-muted hover:text-fg hover:bg-bg-card transition-colors cursor-pointer outline-none disabled:opacity-50"
            >
              {EXPORT_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.name}</option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-fg-muted"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
          {exportLang !== 'en' && (
            <span
              className="text-[10px] font-medium text-amber-500 dark:text-amber-400 uppercase tracking-wider whitespace-nowrap"
              title="Machine-translated — not a professional legal translation"
            >
              ◆ Exp.
            </span>
          )}
          {translating && (
            <span className="text-xs text-fg-muted flex items-center gap-1.5 whitespace-nowrap">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Translating…
            </span>
          )}
          <CopyButton value={value} label={t('policyView.copy', { format: formatLabel })} />
          <PremiumGate feature="pdf" badge={premium}>
            <button
              type="button"
              onClick={handlePdfDownload}
              disabled={translating}
              className="inline-flex h-8 items-center rounded-button border border-border bg-bg-elevated px-3 text-xs font-medium text-fg-muted hover:text-fg hover:bg-bg-card transition-colors disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              {t('policyView.pdf')}
            </button>
          </PremiumGate>
          <PremiumGate feature="docx" badge={premium}>
            <button
              type="button"
              onClick={handleDocxDownload}
              disabled={translating}
              className="inline-flex h-8 items-center rounded-button border border-border bg-bg-elevated px-3 text-xs font-medium text-fg-muted hover:text-fg hover:bg-bg-card transition-colors disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1-2 2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>
              {t('policyView.docx')}
            </button>
          </PremiumGate>
        </div>
      </div>
      <div className="rounded-md border border-border bg-bg-elevated overflow-hidden">
        {format === 'html' ? (
          <iframe
            title={t('policyView.title')}
            srcDoc={prettyHtml}
            sandbox="allow-same-origin"
            className="w-full min-h-[400px] max-h-[70vh] bg-bg"
          />
        ) : (
          <pre className="p-4 text-xs leading-relaxed font-mono text-fg-muted overflow-auto max-h-[500px] whitespace-pre-wrap break-words">
{value}
          </pre>
        )}
      </div>
      {toast.element}
    </div>
  );
}

function useSafeHtml(html: string, theme: 'dark' | 'light', locale: string): string {
  // Pick palette based on active theme
  const isDark = theme === 'dark';
  const colors = {
    body:       isDark ? '#FAFAFA' : '#09090B',
    bg:         isDark ? '#09090B' : '#FFFFFF',
    border:     isDark ? '#27272A' : '#E4E4E7',
    heading:    isDark ? '#FAFAFA' : '#09090B',
    text:       isDark ? '#D4D4D8' : '#3F3F46',
    accent:     isDark ? '#FAFAFA' : '#09090B',
    faint:      isDark ? '#A1A1AA' : '#71717A',
    codeBg:     isDark ? '#18181B' : '#F5F5F5',
  };
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<style>
  body { font-family: Inter, system-ui, -apple-system, sans-serif; color: ${colors.body}; background: ${colors.bg}; padding: 1.25rem 1.5rem; margin: 0; line-height: 1.65; font-size: 14px; }
  h1 { font-size: 1.4rem; margin: 0 0 0.5rem 0; }
  h2 { font-size: 1.1rem; margin: 1.6rem 0 0.5rem; border-top: 1px solid ${colors.border}; padding-top: 1rem; }
  h3 { font-size: 0.95rem; margin: 1rem 0 0.4rem; color: ${colors.heading}; }
  p { margin: 0.5rem 0; color: ${colors.text}; }
  ul, ol { margin: 0.5rem 0; padding-left: 1.4rem; color: ${colors.text}; }
  li { margin: 0.2rem 0; }
  a { color: ${colors.accent}; text-decoration: underline; text-underline-offset: 2px; }
  strong { color: ${colors.accent}; }
  em { color: ${colors.faint}; }
  code { background: ${colors.codeBg}; padding: 0.1rem 0.35rem; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 0.85em; }
</style>
</head>
<body>
${html}
</body>
</html>`;
}
