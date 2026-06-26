// src/lib/terms-generator.ts
// Pure T&C generation with URL-safe hash codec. No server. No I/O.

import clausesData from '@/data/termsClauses.json';
import {
  fillTemplate,
  evaluateCondition,
  markdownToHtml,
  markdownToPlainText,
  encodePolicyToHash,
  decodeHashToPolicy,
  type PolicyInput,
} from '@/lib/generator';

// ---------- Types ----------

export interface TermsInput {
  businessName: string;
  websiteUrl: string;
  jurisdiction: string;
  features: string[];
  contactEmail: string;
}

/** Localization overrides for generated T&C documents. All fields optional — English defaults used when omitted. */
export interface TermsGeneratorOverrides {
  locale?: string;
  title?: string;
  lastUpdatedLabel?: string;
  disclaimer?: string;
  clauseTitles?: Record<string, string>;
  featureLabels?: Record<string, string>;
}

export interface GeneratedDocument {
  markdown: string;
  html: string;
  plainText: string;
  hash: string;
  businessName: string;
  websiteUrl: string;
  generatedAt: string;
}

// ---------- Clause data shape ----------

interface ClauseSection {
  id: string;
  title: string;
  includeWhen: string | { [key: string]: unknown };
  body: string;
}

interface Clauses {
  sections: ClauseSection[];
}

// ---------- Helpers ----------

const JURISDICTION_TO_CURRENCY: Record<string, string> = {
  us: 'USD ($)',
  ca: 'CAD ($)',
  gb: 'GBP (£)',
  de: 'EUR (€)',
  fr: 'EUR (€)',
  es: 'EUR (€)',
  it: 'EUR (€)',
  nl: 'EUR (€)',
  au: 'AUD ($)',
  br: 'BRL (R$)',
  in: 'INR (₹)',
  jp: 'JPY (¥)',
  sg: 'SGD ($)',
  nz: 'NZD ($)',
  mx: 'MXN ($)',
};

function getCurrency(jurisdiction: string): string {
  const code = jurisdiction?.toLowerCase().slice(0, 2);
  return JURISDICTION_TO_CURRENCY[code] || 'USD ($)';
}

export const FEATURE_LABELS: Record<string, string> = {
  accounts: 'User Accounts',
  ugc: 'User-Generated Content',
  payments: 'Payments and Purchases',
};

function buildFeatureList(features: string[] | null | undefined, labels?: Record<string, string>): string {
  if (!features || features.length === 0) return 'We offer a range of services through our platform.';
  const l = labels || FEATURE_LABELS;
  const items = features
    .map((f) => l[f])
    .filter(Boolean);
  if (items.length === 0) return 'We offer a range of services through our platform.';
  return 'Our Service includes the following features: ' + items.join(', ') + '.';
}

function buildProhibitedUses(): string {
  return [
    'Additionally, you agree not to engage in any of the following prohibited activities:',
    '',
    '- Engaging in any activity that is fraudulent, deceptive, or misleading',
    '- Uploading or transmitting any content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable',
    '- Attempting to reverse engineer, decompile, or disassemble any software or technology used in the Service',
    '- Using the Service for any commercial purpose not expressly authorized by these Terms',
    '- Accessing or monitoring the Service using automated means (such as scripts, bots, or crawlers) without our prior written permission',
    '- Interfering with or disrupting the integrity or performance of the Service or any third-party systems',
    '- Uploading or transmitting any material that contains software viruses, Trojan horses, worms, or any other malicious code',
  ].join('\n');
}

function buildServiceDescription(): string {
  return 'access our tools, resources, and information related to privacy policy and legal document generation';
}

function formatDate(iso: string, locale?: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale || 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ---------- Generator ----------

export function generateTerms(input: TermsInput, overrides?: TermsGeneratorOverrides): GeneratedDocument {
  const generatedAt = new Date().toISOString();
  const featureLabels = overrides?.featureLabels ?? FEATURE_LABELS;
  const vars: Record<string, string> = {
    businessName: input.businessName || 'Our Company',
    websiteUrl: input.websiteUrl || 'our website',
    contactEmail: input.contactEmail || '[contact email]',
    jurisdiction: input.jurisdiction || 'your jurisdiction',
    featureList: buildFeatureList(input.features, featureLabels),
    prohibitedUses: buildProhibitedUses(),
    serviceDescription: buildServiceDescription(),
    currency: getCurrency(input.jurisdiction),
  };

  // Wrap TermsInput as PolicyInput-like object for evaluateCondition
  const evalInput: PolicyInput = {
    businessName: input.businessName,
    websiteUrl: input.websiteUrl,
    businessType: '',
    jurisdiction: input.jurisdiction,
    dataCollected: [],
    serviceIds: [],
    lawIds: [],
    contactEmail: input.contactEmail,
    hasDpo: false,
    tone: 'professional',
    features: input.features,
  };

  const clauses = (clausesData as Clauses).sections;
  const included = clauses.filter((s) => evaluateCondition(s.includeWhen, evalInput));

  const title = overrides?.title ?? 'Terms and Conditions';
  const lastUpdatedLabel = overrides?.lastUpdatedLabel ?? '**Last updated:**';
  const disclaimer = overrides?.disclaimer ?? '> ⚠️ **NOT LEGAL ADVICE.** These Terms and Conditions are a template generated for informational purposes only and do not constitute legal advice. Consult a qualified attorney licensed in your jurisdiction to ensure compliance with all applicable laws and regulations.';

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
  const hash = encodeTermsToHash(input);

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

// ---------- Hash codec (same pattern as generator.ts) ----------

export function encodeTermsToHash(input: TermsInput): string {
  return encodePolicyToHash(input as unknown as PolicyInput);
}

export function decodeHashToTerms(hash: string): TermsInput | null {
  try {
    let h = hash.trim();
    if (h.includes('?h=')) h = h.split('?h=').pop()!;
    if (h.includes('#')) h = h.split('#').pop()!;
    const decoded = decodeHashToPolicy(h);
    if (!decoded) return null;
    return {
      businessName: decoded.businessName,
      websiteUrl: decoded.websiteUrl,
      jurisdiction: decoded.jurisdiction,
      features: decoded.features ?? [],
      contactEmail: decoded.contactEmail,
    };
  } catch {
    return null;
  }
}
