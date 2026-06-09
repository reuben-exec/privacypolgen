// src/lib/I18nProvider.tsx
// React context for client-side translations of interactive components
// (Wizard, PolicyReader, PolicyView, CopyButton). Static HTML is translated
// via the [data-i18n] attribute scan in Layout.astro; React components
// hydrate after DOMContentLoaded, so they need their own provider.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentLocale, loadTranslations, t as lookup } from '@/lib/i18n';

interface I18nValue {
  /** Translate a dot-notation key. Returns the key itself if not found. */
  t: (key: string, params?: Record<string, string>) => string;
  /** Look up an array value (e.g. step titles, pluralized labels). */
  ta: (key: string) => string[];
  /** Current locale code (e.g. 'en', 'de', 'es'). */
  locale: string;
}

const fallback: I18nValue = {
  t: (key) => key,
  ta: () => [],
  locale: 'en',
};

const I18nContext = createContext<I18nValue>(fallback);

export function useI18n(): I18nValue {
  return useContext(I18nContext);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<string>('en');
  const [translations, setTranslations] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    // Initial load
    const detected = getCurrentLocale();
    setLocale(detected);
    loadTranslations(detected)
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setTranslations(data);
        }
      })
      .catch(() => {});

    // Listen for event-driven locale switches (no page reload)
    function handleLocaleChange(e: CustomEvent) {
      const newLocale: string = e.detail.locale;
      setLocale(newLocale);
      loadTranslations(newLocale)
        .then((data) => {
          if (data && Object.keys(data).length > 0) {
            setTranslations(data);
          } else {
            setTranslations(null);
          }
        })
        .catch(() => {});
    }

    window.addEventListener('localechange', handleLocaleChange as EventListener);
    return () => window.removeEventListener('localechange', handleLocaleChange as EventListener);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      if (!translations) return key;
      let str = lookup(translations, key);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replaceAll(`{{${k}}}`, v);
        }
      }
      return str;
    },
    [translations],
  );

  const ta = useCallback(
    (key: string): string[] => {
      if (!translations) return [];
      const keys = key.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let val: any = translations;
      for (const k of keys) {
        if (val && typeof val === 'object' && k in val) {
          val = val[k];
        } else {
          return [];
        }
      }
      return Array.isArray(val) ? (val as string[]) : [];
    },
    [translations],
  );

  return (
    <I18nContext value={{ t, ta, locale }}>
      {children}
    </I18nContext>
  );
}
