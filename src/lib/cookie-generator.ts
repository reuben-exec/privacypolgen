// src/lib/cookie-generator.ts
// Pure Cookie Policy generation with URL-safe hash codec. No server. No I/O.

import clausesData from '@/data/cookieClauses.json';
import servicesData from '@/data/services.json';
import {
  fillTemplate,
  evaluateCondition,
  markdownToHtml,
  markdownToPlainText,
  encodePolicyToHash,
  decodeHashToPolicy,
  type PolicyInput,
} from '@/lib/generator';
import type { GeneratedDocument } from '@/lib/terms-generator';

// ---------- Types ----------

export interface CookieInput {
  businessName: string;
  websiteUrl: string;
  cookieTypes: string[];
  serviceIds: string[];
  lawIds: string[];
  hasConsentMechanism: boolean;
  contactEmail: string;
}

/** Localization overrides for generated cookie policy documents. All fields optional — English defaults used when omitted. */
export interface CookieGeneratorOverrides {
  locale?: string;
  title?: string;
  lastUpdatedLabel?: string;
  disclaimer?: string;
  clauseTitles?: Record<string, string>;
  cookieTypeDescriptions?: Record<string, string>;
}

// ---------- Clause / Service data shapes ----------

interface ClauseSection {
  id: string;
  title: string;
  includeWhen: string | { [key: string]: unknown };
  body: string;
}

interface Clauses {
  sections: ClauseSection[];
}

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  policyText: string;
  privacyUrl: string;
}

// ---------- Helpers ----------

export const COOKIE_TYPE_DESCRIPTIONS: Record<string, string> = {
  essential: '**Essential cookies**: These are necessary for the Service to function and cannot be disabled in our systems. They are usually set in response to actions you take that amount to a request for services, such as logging in, filling in forms, or setting your privacy preferences.',
  analytics: '**Analytics cookies**: These cookies help us understand how visitors interact with our Service by collecting and reporting information anonymously. This helps us improve our Service and your experience.',
  preference: '**Preference cookies**: These cookies enable the Service to remember information that changes the way the Service behaves or looks, such as your preferred language or the region you are in.',
  marketing: '**Marketing cookies**: These cookies are used to track visitors across websites. The intention is to display ads that are relevant and engaging for the individual user.',
};

function buildCookieTypesDescription(cookieTypes: string[] | null | undefined, descriptions?: Record<string, string>): string {
  if (!cookieTypes || cookieTypes.length === 0) return 'We use cookies and similar tracking technologies on our Service.';
  const d = descriptions || COOKIE_TYPE_DESCRIPTIONS;
  return cookieTypes
    .map((t) => d[t])
    .filter(Boolean)
    .join('\n\n');
}

function buildThirdPartyCookieDetails(serviceIds: string[] | null | undefined): string {
  const allServices = servicesData as Service[];
  const selected = (serviceIds ?? [])
    .map((id) => allServices.find((s) => s.id === id))
    .filter((s): s is Service => Boolean(s));

  if (selected.length === 0) {
    return 'We do not currently use any third-party services that set cookies on our Service. If this changes, we will update this Cookie Policy accordingly.';
  }

  const sections: string[] = [
    'The following third-party services may set cookies or use similar tracking technologies when you use our Service:',
  ];
  for (const s of selected) {
    sections.push(`\n- **${s.name}** — ${s.description}`);
    if (s.privacyUrl) {
      sections.push(`  See their privacy policy: ${s.privacyUrl}.`);
    }
  }

  sections.push(
    '\nThese third-party services have their own privacy and cookie policies. We encourage you to review them to understand how they collect and process your data.',
  );
  return sections.join('\n');
}

function formatDate(iso: string, locale?: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale || 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ---------- Generator ----------

export function generateCookiePolicy(input: CookieInput, overrides?: CookieGeneratorOverrides): GeneratedDocument {
  const generatedAt = new Date().toISOString();
  const cookieDesc = overrides?.cookieTypeDescriptions ?? COOKIE_TYPE_DESCRIPTIONS;
  const vars: Record<string, string> = {
    businessName: input.businessName || 'Our Company',
    websiteUrl: input.websiteUrl || 'our website',
    contactEmail: input.contactEmail || '[contact email]',
    cookieTypesDescription: buildCookieTypesDescription(input.cookieTypes, cookieDesc),
    thirdPartyCookieDetails: buildThirdPartyCookieDetails(input.serviceIds),
  };

  // Wrap CookieInput as PolicyInput-like object for evaluateCondition
  const evalInput: PolicyInput = {
    businessName: input.businessName,
    websiteUrl: input.websiteUrl,
    businessType: '',
    jurisdiction: '',
    dataCollected: [],
    serviceIds: input.serviceIds,
    lawIds: input.lawIds,
    contactEmail: input.contactEmail,
    hasDpo: false,
    tone: 'professional',
    cookieTypes: input.cookieTypes,
  };

  const clauses = (clausesData as Clauses).sections;
  const included = clauses.filter((s) => evaluateCondition(s.includeWhen, evalInput));

  const title = overrides?.title ?? 'Cookie Policy';
  const lastUpdatedLabel = overrides?.lastUpdatedLabel ?? '**Last updated:**';
  const disclaimer = overrides?.disclaimer ?? '> ⚠️ **NOT LEGAL ADVICE.** This Cookie Policy is a template generated for informational purposes only and does not constitute legal advice. Consult a qualified attorney licensed in your jurisdiction to ensure compliance with all applicable laws and regulations.';

  const parts: string[] = [];
  parts.push(`# ${title}`);
  parts.push('');
  parts.push(`${lastUpdatedLabel} ${formatDate(generatedAt, overrides?.locale)}`);
  parts.push('');
  parts.push(disclaimer);
  parts.push('');

  for (const s of included) {
    parts.push(`## ${overrides?.clauseTitles?.[s.id] ?? s.title}`);
    parts.push('');
    parts.push(fillTemplate(s.body, vars));
    parts.push('');
  }

  const markdown = parts.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  const html = markdownToHtml(markdown);
  const plainText = markdownToPlainText(markdown);
  const hash = encodeCookieToHash(input);

  return {
    markdown,
    html,
    plainText,
    hash,
    businessName: vars.businessName,
    websiteUrl: vars.websiteUrl,
    generatedAt,
  };
}

// ---------- Hash codec ----------

export function encodeCookieToHash(input: CookieInput): string {
  return encodePolicyToHash(input as unknown as PolicyInput);
}

export function decodeHashToCookie(hash: string): CookieInput | null {
  try {
    let h = hash.trim();
    if (h.includes('?h=')) h = h.split('?h=').pop()!;
    if (h.includes('#')) h = h.split('#').pop()!;
    const decoded = decodeHashToPolicy(h);
    if (!decoded) return null;
    return {
      businessName: decoded.businessName,
      websiteUrl: decoded.websiteUrl,
      cookieTypes: decoded.cookieTypes ?? [],
      serviceIds: decoded.serviceIds ?? [],
      lawIds: decoded.lawIds ?? [],
      hasConsentMechanism: decoded.hasConsentMechanism ?? false,
      contactEmail: decoded.contactEmail,
    };
  } catch {
    return null;
  }
}

// ---------- Data re-exports ----------

export type CookieTypeId = keyof typeof COOKIE_TYPE_DESCRIPTIONS;
export const COOKIE_TYPE_LABELS: Record<string, string> = {
  essential: 'Essential',
  analytics: 'Analytics',
  preference: 'Preference / Functional',
  marketing: 'Advertising / Marketing',
};
export const COOKIE_TYPE_OPTIONS = Object.entries(COOKIE_TYPE_LABELS).map(([id, label]) => ({ id, label }));
