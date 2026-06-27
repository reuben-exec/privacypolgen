// src/components/CookieBannerGenerator.tsx
// Interactive UI for configuring and generating cookie consent banner code.
// Premium feature — preview visible to all, copy/paste gated behind PremiumGate.

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/I18nProvider';
import { generateCookieBannerCode, type CookieBannerCode } from '@/lib/cookie-banner-generator';
import {
  type CookieBannerConfig,
  defaultCookieBannerConfig,
  POSITION_OPTIONS,
  STYLE_OPTIONS,
  LANGUAGE_OPTIONS,
  DEFAULT_EXPIRY_DAYS,
  type BannerStyle,
} from '@/lib/cookie-banner-types';
import { PremiumGate } from '@/components/PremiumGate';

type TabKey = 'html' | 'scriptTag' | 'divTag' | 'css' | 'integrations';

const TAB_KEYS: TabKey[] = ['html', 'scriptTag', 'divTag', 'css', 'integrations'];
const TAB_LABELS: Record<TabKey, string> = {
  html: 'Full HTML',
  scriptTag: '<script>',
  divTag: '<div>',
  css: '<style>',
  integrations: 'Integrations',
};

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-fg-muted w-20 shrink-0">{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 rounded-lg border border-border cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 flex-1 rounded-lg border border-border bg-bg px-2.5 text-xs font-mono text-fg focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
      />
    </div>
  );
}

function CategoryToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-bg-card px-3 py-2.5">
      <div>
        <div className="text-sm font-medium text-fg">{label}</div>
        <div className="text-xs text-fg-muted">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
        style={{
          backgroundColor: checked ? 'var(--color-toggle-on)' : 'var(--color-border-strong)',
        }}
      >
        <span
          className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full shadow transition-transform"
          style={{
            backgroundColor: checked ? 'var(--color-toggle-thumb-active)' : 'var(--color-toggle-thumb)',
            transform: checked ? 'translateX(1.125rem)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  );
}

function StyleCard({
  style,
  active,
  onClick,
}: {
  style: { value: BannerStyle; label: string; description: string };
  active: boolean;
  onClick: () => void;
}) {
  const icons: Record<BannerStyle, JSX.Element> = {
    bar: (
      <svg viewBox="0 0 80 20" className="w-full h-full">
        <rect x="0" y="0" width="80" height="20" rx="2" fill={active ? 'var(--color-accent)' : 'var(--color-border)'} opacity={active ? 0.15 : 0.3} />
        <rect x="5" y="8" width="30" height="3" rx="1.5" fill={active ? 'var(--color-accent)' : 'var(--color-fg-muted)'} />
        <rect x="5" y="13" width="50" height="2" rx="1" fill={active ? 'var(--color-accent)' : 'var(--color-fg-muted)'} opacity={0.5} />
      </svg>
    ),
    card: (
      <svg viewBox="0 0 80 60" className="w-full h-full">
        <rect x="45" y="15" width="32" height="40" rx="4" fill={active ? 'var(--color-accent)' : 'var(--color-border)'} opacity={active ? 0.15 : 0.3} />
        <rect x="50" y="22" width="20" height="2" rx="1" fill={active ? 'var(--color-accent)' : 'var(--color-fg-muted)'} />
        <rect x="50" y="28" width="20" height="2" rx="1" fill={active ? 'var(--color-accent)' : 'var(--color-fg-muted)'} opacity={0.5} />
        <rect x="50" y="42" width="10" height="4" rx="2" fill={active ? 'var(--color-accent)' : 'var(--color-border-strong)'} />
      </svg>
    ),
    modal: (
      <svg viewBox="0 0 80 60" className="w-full h-full">
        <rect x="0" y="0" width="80" height="60" fill="var(--color-fg)" opacity={0.05} />
        <rect x="15" y="10" width="50" height="40" rx="6" fill={active ? 'var(--color-accent)' : 'var(--color-border)'} opacity={active ? 0.15 : 0.3} />
        <rect x="22" y="18" width="20" height="2" rx="1" fill={active ? 'var(--color-accent)' : 'var(--color-fg-muted)'} />
        <rect x="22" y="24" width="36" height="2" rx="1" fill={active ? 'var(--color-accent)' : 'var(--color-fg-muted)'} opacity={0.5} />
        <rect x="22" y="40" width="12" height="4" rx="2" fill={active ? 'var(--color-accent)' : 'var(--color-border-strong)'} />
        <rect x="36" y="40" width="12" height="4" rx="2" fill="transparent" stroke={active ? 'var(--color-accent)' : 'var(--color-border-strong)'} strokeWidth={0.8} />
      </svg>
    ),
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all ${
        active
          ? 'border-accent bg-accent/10 shadow-sm'
          : 'border-border bg-bg hover:bg-bg-card hover:border-border-strong'
      }`}
    >
      <div className="h-12 w-full">{icons[style.value]}</div>
      <div className="text-center">
        <div className={`text-xs font-medium ${active ? 'text-accent' : 'text-fg'}`}>{style.label}</div>
        <div className="text-[10px] text-fg-muted mt-0.5">{style.description}</div>
      </div>
    </button>
  );
}

function CodeBlock({ code, label, editable, onEdit }: { code: string; label: string; editable?: boolean; onEdit?: (v: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between rounded-t-lg border border-border bg-bg-elevated px-3 py-1.5">
        <span className="text-xs font-mono text-fg-muted">{label}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-fg px-3 py-1 text-xs font-medium text-bg hover:opacity-90 transition-opacity"
        >
          {copied ? (
            <>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      {editable ? (
        <textarea
          value={code}
          onChange={(e) => onEdit?.(e.target.value)}
          className="max-h-64 w-full overflow-auto rounded-b-lg border border-t-0 border-border bg-bg p-3 text-xs font-mono text-fg leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-ring/20"
          spellCheck={false}
        />
      ) : (
        <pre className="max-h-64 overflow-auto rounded-b-lg border border-t-0 border-border bg-bg p-3 text-xs font-mono text-fg leading-relaxed">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

function ToggleOption({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-bg-card px-3 py-2.5">
      <div>
        <div className="text-sm font-medium text-fg">{label}</div>
        <div className="text-xs text-fg-muted">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative h-5 w-9 shrink-0 rounded-full cursor-pointer transition-colors"
        style={{
          backgroundColor: checked ? 'var(--color-toggle-on)' : 'var(--color-border-strong)',
        }}
      >
        <span
          className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full shadow transition-transform"
          style={{
            backgroundColor: checked ? 'var(--color-toggle-thumb-active)' : 'var(--color-toggle-thumb)',
            transform: checked ? 'translateX(1.125rem)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  );
}

/** Determine compatible positions for a given style */
function getPositionsForStyle(style: BannerStyle): { value: CookieBannerConfig['position']; label: string }[] {
  return POSITION_OPTIONS.filter((p) => p.styles.includes(style)).map(({ value, label }) => ({ value, label }));
}

export function CookieBannerGenerator() {
  const { t } = useI18n();
  const [config, setConfig] = useState<CookieBannerConfig>(defaultCookieBannerConfig);
  const [activeTab, setActiveTab] = useState<TabKey>('html');
  const [cssCode, setCssCode] = useState('');
  const [cssDirty, setCssDirty] = useState(false);

  const update = useCallback((patch: Partial<CookieBannerConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleCategory = useCallback((cat: keyof CookieBannerConfig['categories'], val: boolean) => {
    setConfig((prev) => ({
      ...prev,
      categories: { ...prev.categories, [cat]: val },
    }));
  }, []);

  const code = useMemo(() => generateCookieBannerCode(config), [config]);

  // Keep cssCode in sync when not dirty
  useEffect(() => {
    if (!cssDirty) setCssCode(code.css);
  }, [code.css, cssDirty]);

  // Reset CSS dirty flag when config changes (user re-configured)
  useEffect(() => {
    setCssDirty(false);
    setCssCode(code.css);
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    try {
      window.localStorage.removeItem('ppg_cookie_consent');
    } catch (e) {}

    const isDarkBg = config.bgColor.startsWith('#0') || config.bgColor.startsWith('#1') || config.bgColor.startsWith('#2');
    const previewBodyBg = isDarkBg ? '#0f0f11' : '#f4f4f5';
    const previewBodyFg = isDarkBg ? '#f4f4f5' : '#18181b';

    // Use edited CSS if user modified it, otherwise use generated
    const finalCss = cssDirty ? cssCode : code.css;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: ${previewBodyBg};
            color: ${previewBodyFg};
          }
          .simulated-content {
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            opacity: 0.08;
            user-select: none;
          }
          .simulated-line {
            height: 16px;
            border-radius: 4px;
            background-color: ${previewBodyFg};
          }
        </style>
        ${finalCss}
      </head>
      <body>
        <div class="simulated-content">
          <div class="simulated-line" style="width: 45%;"></div>
          <div class="simulated-line" style="width: 90%;"></div>
          <div class="simulated-line" style="width: 75%;"></div>
          <div class="simulated-line" style="width: 85%;"></div>
          <div class="simulated-line" style="width: 60%;"></div>
        </div>
        ${code.divTag}
        ${code.scriptTag}
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();
  }, [code, config.bgColor, config.textColor, cssDirty, cssCode]);

  // When style changes, auto-select a compatible position
  const handleStyleChange = useCallback((style: BannerStyle) => {
    update({ style });
    const positions = getPositionsForStyle(style);
    if (positions.length && !positions.find((p) => p.value === config.position)) {
      update({ position: positions[0].value });
    }
  }, [config.position, update]);

  const positionsForStyle = getPositionsForStyle(config.style);

  // Build full code output (use edited CSS if dirty)
  const fullHtmlOutput = cssDirty
    ? code.html.replace(/<style>[\s\S]*?<\/style>/, cssCode)
    : code.html;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      {/* Left column: Configuration */}
      <div className="min-w-0 space-y-6">
        {/* Banner Style */}
        <div className="rounded-card border border-border bg-bg-elevated p-6 space-y-6">
          <h3 className="text-sm font-semibold text-fg">Banner Style</h3>
          <div className="grid grid-cols-3 gap-3">
            {STYLE_OPTIONS.map((s) => (
              <StyleCard key={s.value} style={s} active={config.style === s.value} onClick={() => handleStyleChange(s.value)} />
            ))}
          </div>

          {/* Position */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">Position</label>
            <div className="flex flex-wrap gap-2">
              {positionsForStyle.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => update({ position: pos.value })}
                  className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors ${
                    config.position === pos.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border bg-bg text-fg hover:bg-bg-card'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">Language</label>
            <select
              value={config.language}
              onChange={(e) => update({ language: e.target.value as CookieBannerConfig['language'] })}
              className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-fg-muted">
              {config.language === 'auto' ? 'Banner text will match the visitor\'s browser language (fallback: English)' : `Banner text will always display in ${LANGUAGE_OPTIONS.find(o => o.value === config.language)?.label}`}
            </p>
          </div>
        </div>

        {/* Colors */}
        <div className="rounded-card border border-border bg-bg-elevated p-6 space-y-4">
          <h3 className="text-sm font-semibold text-fg">Colors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ColorInput label="Background" value={config.bgColor} onChange={(v) => update({ bgColor: v })} />
            <ColorInput label="Text" value={config.textColor} onChange={(v) => update({ textColor: v })} />
            <ColorInput label="Button BG" value={config.btnBg} onChange={(v) => update({ btnBg: v })} />
            <ColorInput label="Button Text" value={config.btnText} onChange={(v) => update({ btnText: v })} />
          </div>
        </div>

        {/* Categories */}
        <div className="rounded-card border border-border bg-bg-elevated p-6 space-y-4">
          <h3 className="text-sm font-semibold text-fg">Cookie Categories</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <CategoryToggle
              label="Essential"
              description="Always enabled, required for site function"
              checked={config.categories.essential}
              onChange={() => {}}
              disabled
            />
            <CategoryToggle
              label="Analytics"
              description="Site usage statistics"
              checked={config.categories.analytics}
              onChange={(v) => toggleCategory('analytics', v)}
            />
            <CategoryToggle
              label="Preference"
              description="Remember user choices"
              checked={config.categories.preference}
              onChange={(v) => toggleCategory('preference', v)}
            />
            <CategoryToggle
              label="Marketing"
              description="Advertising & tracking"
              checked={config.categories.marketing}
              onChange={(v) => toggleCategory('marketing', v)}
            />
          </div>
        </div>

        {/* URLs & Settings */}
        <div className="rounded-card border border-border bg-bg-elevated p-6 space-y-4">
          <h3 className="text-sm font-semibold text-fg">Links & Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg">Privacy Policy URL</label>
              <input
                type="url"
                value={config.privacyPolicyUrl}
                onChange={(e) => update({ privacyPolicyUrl: e.target.value })}
                placeholder="https://example.com/privacy"
                className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-fg">Cookie Policy URL</label>
              <input
                type="url"
                value={config.cookiePolicyUrl}
                onChange={(e) => update({ cookiePolicyUrl: e.target.value })}
                placeholder="https://example.com/cookies"
                className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg">Consent Expiry (days)</label>
            <input
              type="number"
              min={1}
              max={365}
              value={config.expiryDays}
              onChange={(e) => update({ expiryDays: Math.max(1, parseInt(e.target.value) || DEFAULT_EXPIRY_DAYS) })}
              className="w-28 rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <ToggleOption
              label="Google Consent Mode v2"
              description="Integrates with GA4 and Google Ads for GDPR compliance"
              checked={config.googleConsentMode}
              onChange={(v) => update({ googleConsentMode: v })}
            />
            <ToggleOption
              label="Consent Audit Log"
              description="Store consent decisions in localStorage with timestamps for compliance"
              checked={config.consentLog}
              onChange={(v) => update({ consentLog: v })}
            />
          </div>
        </div>
      </div>

      {/* Right column: Live Preview + Code Output */}
      <div className="min-w-0 space-y-6">
        {/* Live Preview */}
        <div className="rounded-card border border-border bg-bg-elevated p-5">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-fg">Live Preview</h3>
            <span className="rounded-full bg-bg-card px-2 py-0.5 text-[10px] font-medium text-fg-muted">How it looks to your visitors</span>
          </div>
          <div className="relative overflow-hidden rounded-lg border border-border bg-bg-card dark:border-white/10" style={{ height: 320 }}>
            <iframe
              ref={iframeRef}
              title="Cookie Banner Live Preview"
              className="w-full h-full border-0 bg-transparent block"
              sandbox="allow-scripts"
            />
          </div>
        </div>

        {/* Code Output — Premium-gated */}
        <PremiumGate feature="cookie-banner">
          <div className="space-y-3">
            <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
              {TAB_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-3 py-2 text-xs font-medium transition-colors -mb-px whitespace-nowrap ${
                    activeTab === key
                      ? 'border-b-2 border-accent text-accent'
                      : 'text-fg-muted hover:text-fg'
                  }`}
                >
                  {TAB_LABELS[key]}
                </button>
              ))}
            </div>
            <CodeBlock
              code={activeTab === 'html' ? fullHtmlOutput : activeTab === 'scriptTag' ? code.scriptTag : activeTab === 'divTag' ? code.divTag : activeTab === 'integrations' ? code.integrations : cssCode}
              label={TAB_LABELS[activeTab]}
              editable={activeTab === 'css'}
              onEdit={(v) => { setCssCode(v); setCssDirty(true); }}
            />
            <p className="text-xs text-fg-muted">
              {activeTab === 'integrations'
                ? 'Copy the relevant snippet and paste it before your existing analytics/tracking scripts.'
                : activeTab === 'css'
                  ? 'Edit the CSS directly, then copy. Changes update the live preview above.'
                  : 'Paste this code before the closing </body> tag of your HTML pages.'}
            </p>
          </div>
        </PremiumGate>
      </div>
    </div>
  );
}
