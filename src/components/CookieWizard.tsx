// src/components/CookieWizard.tsx
// 3-step wizard for generating a Cookie Policy.

import { useState, useCallback, useMemo } from 'react';
import { I18nProvider, useI18n } from '@/lib/I18nProvider';
import { generateCookiePolicy, encodeCookieToHash, COOKIE_TYPE_OPTIONS, type CookieInput } from '@/lib/cookie-generator';
import { buildCookieOverrides } from '@/lib/buildOverrides';
import ToggleSwitch from '@/components/ToggleSwitch';

const emptyInput: CookieInput = {
  businessName: '',
  websiteUrl: '',
  cookieTypes: [],
  serviceIds: [],
  lawIds: [],
  hasConsentMechanism: false,
  contactEmail: '',
};

function CookieWizardContent() {
  const { t, locale } = useI18n();
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<CookieInput>(emptyInput);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const update = useCallback(<K extends keyof CookieInput>(key: K, value: CookieInput[K]) => {
    setInput(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleArrayItem = useCallback((key: 'cookieTypes' | 'serviceIds' | 'lawIds', id: string) => {
    setInput(prev => ({
      ...prev,
      [key]: prev[key].includes(id)
        ? prev[key].filter(x => x !== id)
        : [...prev[key], id],
    }));
  }, []);

  const requiredFieldsValid = useMemo(() => {
    if (!input.businessName.trim() || !input.websiteUrl.trim() || !input.contactEmail.trim()) return false;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRe.test(input.contactEmail.trim());
  }, [input.businessName, input.websiteUrl, input.contactEmail]);

  const generate = useCallback(() => {
    const overrides = buildCookieOverrides(t, locale);
    const doc = generateCookiePolicy({
      ...input,
      businessName: input.businessName.trim() || 'Our Company',
      websiteUrl: input.websiteUrl.trim(),
      contactEmail: input.contactEmail.trim() || '[contact email]',
    }, overrides);
    const url = `/c?h=${doc.hash}`;
    setGeneratedUrl(url);
    setStep(4);
  }, [input, t, locale]);

  const copyLink = useCallback(() => {
    if (generatedUrl) {
      const absoluteUrl = `${window.location.origin}${generatedUrl}`;
      navigator.clipboard.writeText(absoluteUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }).catch(() => {});
    }
  }, [generatedUrl]);

  const stepTitles = t('cookieWizard.stepTitles') as unknown as string[];
  const titles: string[] = Array.isArray(stepTitles)
    ? stepTitles
    : ['Business Info', 'Cookie Types', 'Contact & Legal'];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              s <= step ? 'bg-fg text-bg' : 'bg-bg-elevated text-fg-muted'
            }`}>
              {s}
            </div>
            <span className={`text-xs font-medium ${s <= step ? 'text-fg' : 'text-fg-muted'}`}>
              {titles[s - 1]}
            </span>
            {s < 3 && <div className={`h-px w-6 ${s < step ? 'bg-fg' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      <div className="space-y-8">
        {/* Step 1: Business Info */}
        {step === 1 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold tracking-tight text-fg">{t('cookieWizard.step1.heading')}</h2>
            <p className="mt-1 text-sm text-fg-muted">{t('cookieWizard.step1.subtitle')}</p>
            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="cw-business" className="mb-1.5 block text-sm font-medium text-fg">{t('cookieWizard.step1.labelBusinessName')}</label>
                <input id="cw-business" type="text" value={input.businessName} onChange={e => update('businessName', e.target.value)}
                  placeholder={t('cookieWizard.step1.placeholderBusinessName') as string}
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
              </div>
              <div>
                <label htmlFor="cw-website" className="mb-1.5 block text-sm font-medium text-fg">{t('cookieWizard.step1.labelWebsiteUrl')}</label>
                <input id="cw-website" type="url" value={input.websiteUrl} onChange={e => update('websiteUrl', e.target.value)}
                  placeholder={t('cookieWizard.step1.placeholderWebsiteUrl') as string}
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
              </div>
            </div>
          </section>
        )}

        {/* Step 2: Cookie Types */}
        {step === 2 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold tracking-tight text-fg">{t('cookieWizard.step2.heading')}</h2>
            <p className="mt-1 text-sm text-fg-muted">{t('cookieWizard.step2.subtitle')}</p>
            <div className="mt-6 space-y-3">
              {COOKIE_TYPE_OPTIONS.map(ct => {
                const checked = input.cookieTypes.includes(ct.id);
                return (
                  <div key={ct.id} className="rounded-lg border border-border bg-bg p-3.5 transition-colors hover:border-fg-muted/20">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-accent" checked={checked} onChange={() => toggleArrayItem('cookieTypes', ct.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium leading-tight text-fg">{ct.label}</div>
                        <div className="mt-0.5 text-xs text-fg-muted">{t(`cookieWizard.cookieTypes.${ct.id}.desc`) as string}</div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 3: Contact + Legal */}
        {step === 3 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold tracking-tight text-fg">{t('cookieWizard.step3.heading')}</h2>
            <p className="mt-1 text-sm text-fg-muted">{t('cookieWizard.step3.subtitle')}</p>
            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="cw-email" className="mb-1.5 block text-sm font-medium text-fg">{t('cookieWizard.step3.labelEmail')}</label>
                <input id="cw-email" type="email" value={input.contactEmail} onChange={e => update('contactEmail', e.target.value)}
                  placeholder={t('cookieWizard.step3.placeholderEmail') as string}
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
                {showValidation && !input.contactEmail.trim() && (
                  <p className="mt-1.5 text-xs text-red-500">{t('validation.contactEmail')}</p>
                )}
              </div>

              <div>
                <label htmlFor="cw-law" className="mb-1.5 block text-sm font-medium text-fg">{t('cookieWizard.step3.labelLaw')}</label>
                <p className="mb-2 text-xs text-fg-muted">{t('cookieWizard.step3.lawHelp') as string}</p>
                <select id="cw-law" value={input.lawIds[0] ?? ''} onChange={e => {
                  if (e.target.value) {
                    setInput(prev => ({ ...prev, lawIds: [e.target.value] }));
                  } else {
                    setInput(prev => ({ ...prev, lawIds: [] }));
                  }
                }}
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20">
                  <option value="">{t('cookieWizard.step3.placeholderLaw') as string}</option>
                  <option value="gdpr">{t('wizard.laws.gdpr.name') as string} — {t('wizard.laws.gdpr.fullName') as string}</option>
                  <option value="lgpd">{t('wizard.laws.lgpd.name') as string} — {t('wizard.laws.lgpd.fullName') as string}</option>
                  <option value="ccpa">{t('wizard.laws.ccpa.name') as string} — {t('wizard.laws.ccpa.fullName') as string}</option>
                  <option value="pipeda">{t('wizard.laws.pipeda.name') as string} — {t('wizard.laws.pipeda.fullName') as string}</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={input.hasConsentMechanism}
                  onChange={v => update('hasConsentMechanism', v)}
                  label={t('cookieWizard.step3.labelConsent') as string}
                  id="cw-consent"
                />
              </div>
            </div>
          </section>
        )}

        {/* Step 4: Result */}
        {step === 4 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-fg">{t('cookieWizard.result.heading')}</h2>
              <p className="mt-1 text-sm text-fg-muted">{t('cookieWizard.result.subtitle')}</p>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0 text-amber-500">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="text-xs leading-relaxed text-fg-muted">
                  <span className="font-semibold text-fg">{t('cookieWizard.result.noticeTitle')}</span>{' '}
                  {t('cookieWizard.result.noticeText')}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">{t('cookieWizard.result.publicLink')}</label>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-bg-elevated px-3 py-2 font-mono text-xs text-fg-muted truncate" title={`${typeof window !== 'undefined' ? window.location.origin : ''}${generatedUrl}`}>
                  {`${typeof window !== 'undefined' ? window.location.origin : ''}${generatedUrl}`}
                </div>
                <button type="button" onClick={copyLink}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-fg transition-colors hover:bg-bg-elevated">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    {copiedLink ? <polyline points="20 6 9 17 4 12" /> : <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>}
                  </svg>
                  {copiedLink ? t('copied') : t('copy')}
                </button>
                <a href={generatedUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-fg px-3 py-2 text-xs font-medium text-bg transition-colors hover:opacity-90"
                  title={t('cookieWizard.result.openTab') as string}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setStep(1); setGeneratedUrl(''); setShowValidation(false) }}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated">
                {t('cookieWizard.result.editAnswers')}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* Navigation */}
      {step < 4 && (
        <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
          <button type="button" onClick={() => { setStep(s => Math.max(1, s - 1)); setShowValidation(false) }} disabled={step <= 1}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            {t('wizard.nav.back')}
          </button>
          {step < 3 ? (
            <button type="button" onClick={() => setStep(s => Math.min(3, s + 1))}
              className="inline-flex items-center gap-2 rounded-lg bg-fg px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:opacity-90">
              {t('wizard.nav.continue')}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          ) : (
            <button type="button" onClick={() => { setShowValidation(true); if (requiredFieldsValid) generate() }}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-bg transition-colors hover:opacity-90">
              {t('cookieWizard.nav.generate')}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      )}

      {showValidation && !requiredFieldsValid && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-fg-muted/30 bg-bg-elevated/50 px-4 py-3 text-sm text-fg-muted">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-amber-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          {t('validation.required')}
        </div>
      )}
    </div>
  );
}

export default function CookieWizard() {
  return (
    <I18nProvider>
      <CookieWizardContent />
    </I18nProvider>
  );
}
