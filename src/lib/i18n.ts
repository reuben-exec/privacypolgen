// src/lib/i18n.ts
// Client-side i18n infrastructure. English is the default (always in HTML).
// Non-English translations are loaded dynamically and applied to [data-i18n] elements.

export interface Locale {
  code: string;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export const availableLocales: Locale[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', dir: 'ltr' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', dir: 'ltr' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', dir: 'ltr' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr' },
];

export const DEFAULT_LOCALE = 'en';

/** localStorage key for persisting locale preference. */
export const LOCALE_KEY = 'ppg-lang';

/** Array of valid locale codes. Single source of truth — keep in sync with availableLocales. */
export const LOCALES = ['en', 'de', 'es', 'ko', 'ja', 'zh', 'ar', 'fr', 'ru', 'pt', 'hi', 'ta', 'ka', 'vi', 'nl', 'tr', 'bn'] as const;

export function isValidLocale(code: string): boolean {
  return availableLocales.some((l) => l.code === code);
}

/**
 * Read the current locale from localStorage, defaulting to 'en'.
 * Does NOT read from URL (?lang=) — the old reload-based approach is gone.
 * Locale is purely a client-side preference stored in localStorage.
 */
export function getCurrentLocale(): string {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (stored && isValidLocale(stored)) return stored;
  } catch {
    // localStorage may be blocked
  }
  return DEFAULT_LOCALE;
}

/**
 * Set the locale: persist to localStorage and dispatch a custom event
 * so all listeners (static page i18n, React I18nProvider, LangSwitcher)
 * can react without a page reload.
 */
export function setLocale(locale: string): void {
  if (!isValidLocale(locale)) return;
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // localStorage may be blocked
  }
  window.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
}

/**
 * Pre-built map of locale → async loader.
 * import.meta.glob is resolved by Vite at build time, so the @/ alias
 * works correctly — unlike a plain dynamic import() which the browser
 * would try to resolve literally.
 */
const translationModules = import.meta.glob<{ default: Record<string, unknown> }>('@/i18n/*.json');

/** Dynamically load translation JSON for a locale. Falls back to empty. */
export async function loadTranslations(locale: string): Promise<Record<string, unknown>> {
  const path = `/src/i18n/${locale}.json`;
  const loader = translationModules[path];
  if (!loader) return {};
  try {
    const mod = await loader();
    return mod.default;
  } catch {
    return {};
  }
}

/** Look up a dot-notation key in translations. Returns the key itself if not found. */
export function t(translations: Record<string, unknown>, key: string): string {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }
  return typeof value === 'string' ? value : key;
}

/**
 * Apply translations to the DOM: iterate all [data-i18n] elements and replace
 * their textContent with the translated string.
 * Also updates <html lang=""> and (if the locale has a different dir) the dir attribute.
 *
 * Before overwriting, saves the original English text to `data-i18n-orig`
 * so resetTranslations() can restore it when switching back to English.
 */
export function applyTranslations(translations: Record<string, unknown>, locale: string): void {
  const localeInfo = availableLocales.find((l) => l.code === locale);

  // Update <html> lang attribute
  document.documentElement.setAttribute('lang', locale);

  // Update dir if RTL
  if (localeInfo && localeInfo.dir !== 'ltr') {
    document.documentElement.setAttribute('dir', localeInfo.dir);
  }

  // Walk all [data-i18n] elements
  const elements = document.querySelectorAll<HTMLElement>('[data-i18n]');
  for (const el of elements) {
    const key = el.getAttribute('data-i18n');
    if (!key) continue;

    // Save the original English text before overwriting (only once)
    if (!el.hasAttribute('data-i18n-orig')) {
      el.setAttribute('data-i18n-orig', el.textContent ?? '');
    }

    const translated = t(translations, key);
    if (translated !== key) {
      // Handle different element types
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.placeholder = translated;
      } else {
        el.textContent = translated;
      }
    }
  }

  // Update [data-i18n-aria] for aria-labels (no original-saving needed — low-traffic)
  const ariaElements = document.querySelectorAll<HTMLElement>('[data-i18n-aria]');
  for (const el of ariaElements) {
    const key = el.getAttribute('data-i18n-aria');
    if (!key) continue;
    const translated = t(translations, key);
    if (translated !== key) {
      el.setAttribute('aria-label', translated);
    }
  }

  // Update [data-i18n-title] for title attributes
  const titleElements = document.querySelectorAll<HTMLElement>('[data-i18n-title]');
  for (const el of titleElements) {
    const key = el.getAttribute('data-i18n-title');
    if (!key) continue;
    const translated = t(translations, key);
    if (translated !== key) {
      el.setAttribute('title', translated);
    }
  }
}

/**
 * Restore all [data-i18n] elements to their original English text
 * (saved by applyTranslations as data-i18n-orig).
 */
export function resetTranslations(): void {
  const elements = document.querySelectorAll<HTMLElement>('[data-i18n]');
  for (const el of elements) {
    const orig = el.getAttribute('data-i18n-orig');
    if (orig !== null) {
      el.textContent = orig;
    }
  }
  document.documentElement.setAttribute('lang', 'en');
  document.documentElement.removeAttribute('dir');
}
