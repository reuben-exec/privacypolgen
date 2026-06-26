// src/lib/I18nProvider.tsx
// React context for client-side translations — English only.
// Google Translate Website Widget handles client-side translation for non-English users.
// All locale detection, dynamic loading, and event listeners removed.
import { createContext, useContext, type ReactNode } from 'react';
import { t as tFn, loadTranslations } from '@/lib/i18n';

interface I18nValue {
  /** Translate a dot-notation key. Returns the key itself if not found. */
  t: (key: string, params?: Record<string, string>) => string;
  /** Look up an array value (e.g. step titles, pluralized labels). */
  ta: (key: string) => string[];
  /** Always 'en' — Google Translate handles client-side translation. */
  locale: string;
}

const enTranslations = loadTranslations();

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
  // t function with parameter interpolation
  const t = (key: string, params?: Record<string, string>): string => {
    let str = tFn(enTranslations, key);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{{${k}}}`, v);
      }
    }
    return str;
  };

  const ta = (key: string): string[] => {
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = enTranslations;
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        return [];
      }
    }
    return Array.isArray(val) ? (val as string[]) : [];
  };

  return (
    <I18nContext.Provider value={{ t, ta, locale: 'en' }}>
      {children}
    </I18nContext.Provider>
  );
}
