// src/lib/i18n.ts
// English-only translations. Google Translate Website Widget handles client-side
// translation for non-English users. All locale detection, routing, and dynamic
// loading removed. The `t()` function keeps its signature so all existing imports work.

import en from '@/i18n/en.json';

/**
 * Look up a dot-notation key in translations. Returns the key itself if not found.
 * Signature preserved for backward compatibility with existing imports.
 */
export function t(translations: Record<string, unknown>, key: string): string {
  const keys = key.split('.');
  let value: unknown = translations;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  return typeof value === 'string' ? value : key;
}

/** Returns English translations. All pages serve in English. */
export function loadTranslations(): Record<string, unknown> {
  return en as Record<string, unknown>;
}

/**
 * Prepend locale prefix to a path. With Google Translate, all pages serve
 * in English, so this is a no-op. Kept for backward compatibility.
 */
export function localizePath(path: string, _locale?: string): string {
  return path;
}
