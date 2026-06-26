// src/lib/buildOverrides.ts
// Build generator/export overrides from i18n t() function — callers just pass t + locale.

import type { GeneratorOverrides } from '@/lib/generator';
import type { TermsGeneratorOverrides } from '@/lib/terms-generator';
import type { CookieGeneratorOverrides } from '@/lib/cookie-generator';
import type { ExportOverrides } from '@/lib/export';

type TFunc = (key: string, params?: Record<string, string>) => string;

/**
 * Helper: calls `t(key)`. If the result looks like an untranslated policy key
 * (i.e. starts with "policy."), return `undefined` so the generator's built-in
 * ?? fallback defaults activate automatically.
 */
function tx(t: TFunc, key: string): string | undefined {
  const val = t(key);
  if (val.startsWith('policy.')) return undefined;
  return val;
}

/** Build GeneratorOverrides from i18n t() and locale. */
export function buildGeneratorOverrides(t: TFunc, locale: string): GeneratorOverrides {
  return {
    locale,
    title: tx(t, 'policy.privacy.title'),
    lastUpdatedLabel: tx(t, 'policy.privacy.lastUpdatedLabel'),
    disclaimer: tx(t, 'policy.privacy.disclaimer'),
    preamble: tx(t, 'policy.privacy.preamble'),
    clauseTitles: {
      introduction: tx(t, 'policy.privacy.clauseTitles.introduction'),
      'data-collected': tx(t, 'policy.privacy.clauseTitles.data-collected'),
      'personal-info': tx(t, 'policy.privacy.clauseTitles.personal-info'),
      'usage-data': tx(t, 'policy.privacy.clauseTitles.usage-data'),
      'analytics-details': tx(t, 'policy.privacy.clauseTitles.analytics-details'),
      cookies: tx(t, 'policy.privacy.clauseTitles.cookies'),
      'cookie-consent': tx(t, 'policy.privacy.clauseTitles.cookie-consent'),
      'use-of-data': tx(t, 'policy.privacy.clauseTitles.use-of-data'),
      advertising: tx(t, 'policy.privacy.clauseTitles.advertising'),
      'email-marketing': tx(t, 'policy.privacy.clauseTitles.email-marketing'),
      'payment-processing': tx(t, 'policy.privacy.clauseTitles.payment-processing'),
      'third-party': tx(t, 'policy.privacy.clauseTitles.third-party'),
      'legal-basis': tx(t, 'policy.privacy.clauseTitles.legal-basis'),
      'your-rights': tx(t, 'policy.privacy.clauseTitles.your-rights'),
      retention: tx(t, 'policy.privacy.clauseTitles.retention'),
      transfers: tx(t, 'policy.privacy.clauseTitles.transfers'),
      'international-transfers-gdpr': tx(t, 'policy.privacy.clauseTitles.international-transfers-gdpr'),
      security: tx(t, 'policy.privacy.clauseTitles.security'),
      children: tx(t, 'policy.privacy.clauseTitles.children'),
      'do-not-sell': tx(t, 'policy.privacy.clauseTitles.do-not-sell'),
      changes: tx(t, 'policy.privacy.clauseTitles.changes'),
      contact: tx(t, 'policy.privacy.clauseTitles.contact'),
      disclaimer: tx(t, 'policy.privacy.clauseTitles.disclaimer'),
    },
    dataTypeLabels: {
      emails: tx(t, 'policy.dataTypeLabels.emails'),
      names: tx(t, 'policy.dataTypeLabels.names'),
      addresses: tx(t, 'policy.dataTypeLabels.addresses'),
      phones: tx(t, 'policy.dataTypeLabels.phones'),
      companies: tx(t, 'policy.dataTypeLabels.companies'),
      'user-accounts': tx(t, 'policy.dataTypeLabels.user-accounts'),
      payments: tx(t, 'policy.dataTypeLabels.payments'),
      'usage-data': tx(t, 'policy.dataTypeLabels.usage-data'),
      'device-info': tx(t, 'policy.dataTypeLabels.device-info'),
      'ip-addresses': tx(t, 'policy.dataTypeLabels.ip-addresses'),
      'location-data': tx(t, 'policy.dataTypeLabels.location-data'),
      analytics: tx(t, 'policy.dataTypeLabels.analytics'),
      cookies: tx(t, 'policy.dataTypeLabels.cookies'),
      ads: tx(t, 'policy.dataTypeLabels.ads'),
    },
  };
}

/** Build TermsGeneratorOverrides from i18n t() and locale. */
export function buildTermsOverrides(t: TFunc, locale: string): TermsGeneratorOverrides {
  return {
    locale,
    title: tx(t, 'policy.terms.title'),
    lastUpdatedLabel: tx(t, 'policy.terms.lastUpdatedLabel'),
    disclaimer: tx(t, 'policy.terms.disclaimer'),
    clauseTitles: {
      acceptance: tx(t, 'policy.terms.clauseTitles.acceptance'),
      description: tx(t, 'policy.terms.clauseTitles.description'),
      'account-registration': tx(t, 'policy.terms.clauseTitles.account-registration'),
      'user-conduct': tx(t, 'policy.terms.clauseTitles.user-conduct'),
      'user-content': tx(t, 'policy.terms.clauseTitles.user-content'),
      'payment-terms': tx(t, 'policy.terms.clauseTitles.payment-terms'),
      'intellectual-property': tx(t, 'policy.terms.clauseTitles.intellectual-property'),
      'third-party-links': tx(t, 'policy.terms.clauseTitles.third-party-links'),
      termination: tx(t, 'policy.terms.clauseTitles.termination'),
      disclaimer: tx(t, 'policy.terms.clauseTitles.disclaimer'),
      'governing-law': tx(t, 'policy.terms.clauseTitles.governing-law'),
      changes: tx(t, 'policy.terms.clauseTitles.changes'),
      contact: tx(t, 'policy.terms.clauseTitles.contact'),
    },
    featureLabels: {
      accounts: tx(t, 'policy.terms.featureLabels.accounts'),
      ugc: tx(t, 'policy.terms.featureLabels.ugc'),
      payments: tx(t, 'policy.terms.featureLabels.payments'),
    },
  };
}

/** Build CookieGeneratorOverrides from i18n t() and locale. */
export function buildCookieOverrides(t: TFunc, locale: string): CookieGeneratorOverrides {
  return {
    locale,
    title: tx(t, 'policy.cookie.title'),
    lastUpdatedLabel: tx(t, 'policy.cookie.lastUpdatedLabel'),
    disclaimer: tx(t, 'policy.cookie.disclaimer'),
    clauseTitles: {
      introduction: tx(t, 'policy.cookie.clauseTitles.introduction'),
      'types-of-cookies': tx(t, 'policy.cookie.clauseTitles.types-of-cookies'),
      'essential-cookies': tx(t, 'policy.cookie.clauseTitles.essential-cookies'),
      'analytics-cookies': tx(t, 'policy.cookie.clauseTitles.analytics-cookies'),
      'preference-cookies': tx(t, 'policy.cookie.clauseTitles.preference-cookies'),
      'marketing-cookies': tx(t, 'policy.cookie.clauseTitles.marketing-cookies'),
      'third-party-cookies': tx(t, 'policy.cookie.clauseTitles.third-party-cookies'),
      'cookie-consent': tx(t, 'policy.cookie.clauseTitles.cookie-consent'),
      'managing-cookies': tx(t, 'policy.cookie.clauseTitles.managing-cookies'),
      updates: tx(t, 'policy.cookie.clauseTitles.updates'),
      contact: tx(t, 'policy.cookie.clauseTitles.contact'),
    },
    cookieTypeDescriptions: {
      essential: tx(t, 'policy.cookie.cookieTypeDescriptions.essential'),
      analytics: tx(t, 'policy.cookie.cookieTypeDescriptions.analytics'),
      preference: tx(t, 'policy.cookie.cookieTypeDescriptions.preference'),
      marketing: tx(t, 'policy.cookie.cookieTypeDescriptions.marketing'),
    },
  };
}

/** Build ExportOverrides from i18n t() and businessName. */
export function buildExportOverrides(t: TFunc): ExportOverrides {
  return {
    preparedBy: tx(t, 'policy.export.preparedBy'),
    generatedBy: tx(t, 'policy.export.generatedBy'),
    pageLabel: tx(t, 'policy.export.pageLabel'),
    filename: tx(t, 'policy.export.filename'),
  };
}
