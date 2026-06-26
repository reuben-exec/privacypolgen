// src/lib/i18n-server.ts
// Build-time translation loader — English only.
// Google Translate Website Widget handles client-side translation for non-English users.
//
// Usage in .astro files (unchanged):
//   import { getTranslations, t } from '@/lib/i18n-server';
//   const tx = await getTranslations();
//   <h1>{t(tx, 'pricingPage.heading')}</h1>

import en from '@/i18n/en.json';

const translations = en as Record<string, unknown>;

/** Returns English translations synchronously. Wrapped in Promise for backward compatibility. */
export async function getTranslations(): Promise<Record<string, unknown>> {
  return translations;
}

/**
 * Look up a translation value by dot-notation key.
 * Returns the key itself if not found (safe fallback for debugging).
 * Signature preserved — existing callers pass `(tx, 'key')` unchanged.
 */
export function t(
  translations: Record<string, unknown>,
  key: string,
): string {
  const parts = key.split('.');
  let val: unknown = translations;
  for (const p of parts) {
    if (val && typeof val === 'object') {
      val = (val as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }
  return typeof val === 'string' ? val : key;
}
