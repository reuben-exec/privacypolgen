// src/components/PolicyView.tsx
import { useState, useEffect } from 'react';
import type { GeneratedPolicy } from '@/lib/generator';
import { CopyButton } from '@/components/CopyButton';
import { useI18n } from '@/lib/I18nProvider';

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
  const theme = useTheme();

  const value =
    format === 'markdown' ? policy.markdown :
    format === 'html' ? policy.html :
    policy.plainText;

  const prettyHtml = useSafeHtml(policy.html, theme, locale);
  const formatLabel = t(`policyView.tabs.${format}`);

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
          <CopyButton value={value} label={t('policyView.copy', { format: formatLabel })} />
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); alert('PDF export is a Premium feature. Coming soon.'); }}
            className="inline-flex h-8 items-center rounded-button border border-border bg-bg-elevated px-3 text-xs font-medium text-fg-muted hover:text-fg hover:bg-bg-card transition-colors"
            aria-disabled
          >
            <svg className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            {t('policyView.pdf')} <span className="ml-1 text-fg-faint text-[10px] uppercase">{t('policyView.pro')}</span>
          </a>
        </div>
      </div>
      <div className="rounded-md border border-border bg-bg-elevated overflow-hidden">
        {format === 'html' ? (
          <iframe
            title={t('policyView.title')}
            srcDoc={prettyHtml}
            className="w-full h-[500px] bg-bg"
          />
        ) : (
          <pre className="p-4 text-xs leading-relaxed font-mono text-fg-muted overflow-auto max-h-[500px] whitespace-pre-wrap break-words">
{value}
          </pre>
        )}
      </div>
    </div>
  );
}

function useSafeHtml(html: string, theme: 'dark' | 'light', locale: string): string {
  // Pick palette based on active theme
  const isDark = theme === 'dark';
  const colors = {
    body:       isDark ? '#ededed' : '#0a0a0a',
    bg:         isDark ? '#000'    : '#fff',
    border:     isDark ? '#1f1f1f' : '#e5e5e5',
    heading:    isDark ? '#ededed' : '#0a0a0a',
    text:       isDark ? '#c8c8c8' : '#444444',
    accent:     isDark ? '#ededed' : '#0a0a0a',
    faint:      isDark ? '#888'    : '#666666',
    codeBg:     isDark ? '#0a0a0a' : '#f5f5f5',
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
