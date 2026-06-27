// src/components/TermsWizard.tsx
// 3-step wizard for generating Terms & Conditions.

import { useState, useCallback, useMemo, useEffect } from 'react';
import { I18nProvider, useI18n } from '@/lib/I18nProvider';
import { generateTerms, encodeTermsToHash, type TermsInput } from '@/lib/terms-generator';
import { buildTermsOverrides } from '@/lib/buildOverrides';

const FEATURE_OPTIONS = [
  { id: 'accounts', labelKey: 'termsWizard.features.accounts.name', descKey: 'termsWizard.features.accounts.desc' },
  { id: 'ugc', labelKey: 'termsWizard.features.ugc.name', descKey: 'termsWizard.features.ugc.desc' },
  { id: 'payments', labelKey: 'termsWizard.features.payments.name', descKey: 'termsWizard.features.payments.desc' },
];

const JURISDICTION_OPTIONS = [
  { value: 'us', labelKey: 'wizard.jurisdictions.us' },
  { value: 'ca', labelKey: 'wizard.jurisdictions.ca' },
  { value: 'gb', labelKey: 'wizard.jurisdictions.gb' },
  { value: 'de', labelKey: 'wizard.jurisdictions.de' },
  { value: 'fr', labelKey: 'wizard.jurisdictions.fr' },
  { value: 'es', labelKey: 'wizard.jurisdictions.es' },
  { value: 'it', labelKey: 'wizard.jurisdictions.it' },
  { value: 'nl', labelKey: 'wizard.jurisdictions.nl' },
  { value: 'au', labelKey: 'wizard.jurisdictions.au' },
  { value: 'br', labelKey: 'wizard.jurisdictions.br' },
  { value: 'in', labelKey: 'wizard.jurisdictions.in' },
  { value: 'global', labelKey: 'wizard.jurisdictions.global' },
];

const emptyInput: TermsInput = {
  businessName: '',
  websiteUrl: '',
  jurisdiction: '',
  features: [],
  contactEmail: '',
};

function TermsWizardContent() {
  const { t, locale } = useI18n();
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<TermsInput>(emptyInput);
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const update = useCallback(<K extends keyof TermsInput>(key: K, value: TermsInput[K]) => {
    setInput(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleFeature = useCallback((id: string) => {
    setInput(prev => ({
      ...prev,
      features: prev.features.includes(id)
        ? prev.features.filter(f => f !== id)
        : [...prev.features, id],
    }));
  }, []);

  const requiredFieldsValid = useMemo(() => {
    if (!input.businessName.trim() || !input.websiteUrl.trim() || !input.contactEmail.trim()) return false;
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRe.test(input.contactEmail.trim());
  }, [input.businessName, input.websiteUrl, input.contactEmail]);

  const generate = useCallback(() => {
    const overrides = buildTermsOverrides(t, locale);
    const doc = generateTerms({
      ...input,
      businessName: input.businessName.trim() || 'Our Company',
      websiteUrl: input.websiteUrl.trim(),
      contactEmail: input.contactEmail.trim() || '[contact email]',
      jurisdiction: input.jurisdiction || 'your jurisdiction',
    }, overrides);
    const url = `/t?h=${doc.hash}`;
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

  const stepTitles = t('termsWizard.stepTitles') as unknown as string[];
  const titles: string[] = Array.isArray(stepTitles)
    ? stepTitles
    : ['Business Info', 'Features', 'Contact'];

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
            <h2 className="text-xl font-semibold tracking-tight text-fg">{t('termsWizard.step1.heading')}</h2>
            <p className="mt-1 text-sm text-fg-muted">{t('termsWizard.step1.subtitle')}</p>
            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="tw-business" className="mb-1.5 block text-sm font-medium text-fg">{t('termsWizard.step1.labelBusinessName')}</label>
                <input id="tw-business" type="text" value={input.businessName} onChange={e => update('businessName', e.target.value)}
                  placeholder={t('termsWizard.step1.placeholderBusinessName') as string}
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
              </div>
              <div>
                <label htmlFor="tw-website" className="mb-1.5 block text-sm font-medium text-fg">{t('termsWizard.step1.labelWebsiteUrl')}</label>
                <input id="tw-website" type="url" value={input.websiteUrl} onChange={e => update('websiteUrl', e.target.value)}
                  placeholder={t('termsWizard.step1.placeholderWebsiteUrl') as string}
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
              </div>
              <div>
                <label htmlFor="tw-jurisdiction" className="mb-1.5 block text-sm font-medium text-fg">{t('termsWizard.step1.labelJurisdiction')}</label>
                <select id="tw-jurisdiction" value={input.jurisdiction} onChange={e => update('jurisdiction', e.target.value)}
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20">
                  <option value="">{t('termsWizard.step1.placeholderJurisdiction') as string}</option>
                  {JURISDICTION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{t(opt.labelKey) as string}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Step 2: Features */}
        {step === 2 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold tracking-tight text-fg">{t('termsWizard.step2.heading')}</h2>
            <p className="mt-1 text-sm text-fg-muted">{t('termsWizard.step2.subtitle')}</p>
            <div className="mt-6 space-y-3">
              {FEATURE_OPTIONS.map(f => {
                const checked = input.features.includes(f.id);
                return (
                  <div key={f.id} className="rounded-lg border border-border bg-bg p-3.5 transition-colors hover:border-fg-muted/20">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-accent" checked={checked} onChange={() => toggleFeature(f.id)} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium leading-tight text-fg">{t(f.labelKey) as string}</div>
                        <div className="mt-0.5 text-xs text-fg-muted">{t(f.descKey) as string}</div>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 3: Contact */}
        {step === 3 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold tracking-tight text-fg">{t('termsWizard.step3.heading')}</h2>
            <p className="mt-1 text-sm text-fg-muted">{t('termsWizard.step3.subtitle')}</p>
            <div className="mt-6 space-y-5">
              <div>
                <label htmlFor="tw-email" className="mb-1.5 block text-sm font-medium text-fg">{t('termsWizard.step3.labelEmail')}</label>
                <input id="tw-email" type="email" value={input.contactEmail} onChange={e => update('contactEmail', e.target.value)}
                  placeholder={t('termsWizard.step3.placeholderEmail') as string}
                  className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20" />
                {showValidation && !input.contactEmail.trim() && (
                  <p className="mt-1.5 text-xs text-red-500">{t('validation.contactEmail')}</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Step 4: Result */}
        {step === 4 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-5">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-fg">{t('termsWizard.result.heading')}</h2>
              <p className="mt-1 text-sm text-fg-muted">{t('termsWizard.result.subtitle')}</p>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0 text-amber-500">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <p className="text-xs leading-relaxed text-fg-muted">
                  <span className="font-semibold text-fg">{t('termsWizard.result.noticeTitle')}</span>{' '}
                  {t('termsWizard.result.noticeText')}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-fg-muted">{t('termsWizard.result.publicLink')}</label>
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
                  title={t('termsWizard.result.openTab') as string}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setStep(1); setGeneratedUrl(''); setShowValidation(false) }}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-bg-elevated">
                {t('termsWizard.result.editAnswers')}
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
              {t('termsWizard.nav.generate')}
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

export default function TermsWizard() {
  return (
    <I18nProvider>
      <TermsWizardContent />
    </I18nProvider>
  );
}
