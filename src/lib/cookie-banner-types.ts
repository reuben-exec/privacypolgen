// src/lib/cookie-banner-types.ts
// Types and defaults for the cookie banner code generator.

export type BannerPosition = 'top' | 'bottom' | 'bottom-left' | 'bottom-right' | 'modal';
export type BannerStyle = 'bar' | 'card' | 'modal';
export type BannerLanguage = 'auto' | 'en' | 'es' | 'de' | 'fr' | 'ar' | 'pt' | 'ja' | 'ko' | 'zh';

export interface CookieBannerConfig {
  position: BannerPosition;
  style: BannerStyle;
  language: BannerLanguage;
  bgColor: string;
  textColor: string;
  btnBg: string;
  btnText: string;
  categories: {
    essential: boolean;
    analytics: boolean;
    preference: boolean;
    marketing: boolean;
  };
  privacyPolicyUrl: string;
  cookiePolicyUrl: string;
  expiryDays: number;
  googleConsentMode: boolean;
  consentLog: boolean;
}

export const POSITION_OPTIONS: { value: BannerPosition; label: string; styles: BannerStyle[] }[] = [
  { value: 'bottom', label: 'Bottom', styles: ['bar', 'card'] },
  { value: 'top', label: 'Top', styles: ['bar'] },
  { value: 'bottom-left', label: 'Bottom Left', styles: ['card'] },
  { value: 'bottom-right', label: 'Bottom Right', styles: ['card'] },
  { value: 'modal', label: 'Center Modal', styles: ['modal'] },
];

export const STYLE_OPTIONS: { value: BannerStyle; label: string; description: string }[] = [
  { value: 'bar', label: 'Bar', description: 'Full-width strip at top or bottom' },
  { value: 'card', label: 'Card', description: 'Floating card in a corner' },
  { value: 'modal', label: 'Modal', description: 'Centered popup with backdrop' },
];

export const LANGUAGE_OPTIONS: { value: BannerLanguage; label: string }[] = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'ar', label: 'العربية' },
  { value: 'pt', label: 'Português' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' },
];

export const DEFAULT_EXPIRY_DAYS = 365;

export const defaultCookieBannerConfig: CookieBannerConfig = {
  position: 'bottom',
  style: 'bar',
  language: 'auto',
  bgColor: '#18181B',
  textColor: '#FAFAFA',
  btnBg: '#6366F1',
  btnText: '#FFFFFF',
  categories: {
    essential: true,
    analytics: false,
    preference: false,
    marketing: false,
  },
  privacyPolicyUrl: '',
  cookiePolicyUrl: '',
  expiryDays: DEFAULT_EXPIRY_DAYS,
  googleConsentMode: false,
  consentLog: false,
};
