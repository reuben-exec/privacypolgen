// src/lib/generator.ts
// Pure policy generation + URL-safe hash codec. No server. No I/O.

import servicesData from '@/data/services.json';
import lawsData from '@/data/laws.json';
import businessTypesData from '@/data/businessTypes.json';
import clausesData from '@/data/clauses.json';
import pako from 'pako';

// ---------- Jurisdiction code → display name ----------

const JURISDICTION_NAMES: Record<string, string> = {
  us: 'the United States',
  ca: 'Canada',
  gb: 'the United Kingdom',
  de: 'Germany',
  fr: 'France',
  es: 'Spain',
  it: 'Italy',
  nl: 'the Netherlands',
  se: 'Sweden',
  no: 'Norway',
  dk: 'Denmark',
  ie: 'Ireland',
  au: 'Australia',
  nz: 'New Zealand',
  br: 'Brazil',
  sg: 'Singapore',
  jp: 'Japan',
  in: 'India',
  mx: 'Mexico',
  global: 'your country',
};

// ---------- Types ----------

export type BusinessTypeId = string;

export interface PolicyInput {
  // Step 1: Business info
  businessName: string;
  websiteUrl: string;
  businessType: BusinessTypeId;
  jurisdiction: string; // e.g. "United States", "Germany", "Global"

  // Step 2: Data collection (selected data types)
  dataCollected: string[]; // ids like "emails", "names", "payments", etc.
  // Step 3: Third-party services
  serviceIds: string[];
  // Step 4: Applicable laws
  lawIds: string[];

  // Step 5: Contact
  contactEmail: string;
  hasDpo: boolean;
  dpoEmail?: string;

  // Cosmetic
  tone: 'plain' | 'professional';

  // Optional — used by T&C and Cookie generators via evaluateCondition
  features?: string[];
  cookieTypes?: string[];
}

/** Localization overrides for generated documents. All fields optional — English defaults used when omitted. */
export interface GeneratorOverrides {
  locale?: string;
  title?: string;
  lastUpdatedLabel?: string;
  disclaimer?: string;
  preamble?: string;
  clauseTitles?: Record<string, string>;
  dataTypeLabels?: Record<string, string>;
}

export interface GeneratedPolicy {
  markdown: string;
  html: string;
  plainText: string;
  hash: string;
  businessName: string;
  websiteUrl: string;
  generatedAt: string; // ISO date
}

// ---------- Data shape from JSON ----------

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  policyText: string;
  privacyUrl: string;
}
interface Law {
  id: string;
  name: string;
  fullName: string;
  region: string;
  appliesToCountries: string[] | '*';
  appliesToStates?: string[];
  appliesToAge?: number;
  description: string;
  rights: string[];
  legalBasisText: string;
  dpoText: string;
}
interface BusinessType {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultData: string[];
  defaultServices: string[];
  defaultLaws: string[];
}
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

const dataTypeLabels: Record<string, string> = {
  emails: 'Email addresses',
  names: 'First and last name',
  addresses: 'Mailing or billing addresses',
  phones: 'Phone numbers',
  companies: 'Company or organization name',
  'user-accounts': 'Account credentials (usernames, hashed passwords)',
  payments: 'Payment information (processed by our payment provider, not stored on our servers)',
  'usage-data': 'Usage data and activity logs',
  'device-info': 'Device and browser information',
  'ip-addresses': 'IP addresses',
  'location-data': 'Approximate geographic location',
  analytics: 'Analytics and behavioral data',
  cookies: 'Cookies and similar tracking technologies',
  ads: 'Advertising identifiers and conversion data',
};

const lawById = (id: string) =>
  (lawsData as Law[]).find((l) => l.id === id);
const serviceById = (id: string) =>
  (servicesData as Service[]).find((s) => s.id === id);
const businessTypeById = (id: string) =>
  (businessTypesData as BusinessType[]).find((b) => b.id === id);

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
}

function listOr(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function formatDate(iso: string, locale?: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale || 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// Known law IDs for backward-compat string matching
const KNOWN_LAW_IDS = ['gdpr', 'ccpa', 'cpra', 'coppa', 'caloppa', 'pipeda', 'lgpd', 'dpdp'];

export function evaluateCondition(cond: string | { [key: string]: unknown }, input: PolicyInput): boolean {
  // String conditions
  if (typeof cond === 'string') {
    if (cond === 'always') return true;
    // Backward compat: check as law ID first
    if (KNOWN_LAW_IDS.includes(cond)) {
      return (input.lawIds ?? []).includes(cond);
    }
    // Fix 'data-collected' bug: true if any data types are collected
    if (cond === 'data-collected') {
      return (input.dataCollected ?? []).length > 0;
    }
    // Backward compat: treat as data type ID
    return (input.dataCollected ?? []).includes(cond);
  }

  // Object condition — check which key is present
  if (typeof cond === 'object' && cond !== null) {
    const c = cond as { [key: string]: unknown };

    if ('any' in c) {
      const raw = c['any'];
      const conditions = Array.isArray(raw) ? raw as (string | { [key: string]: unknown })[] : [];
      return conditions.some((sub) => evaluateCondition(sub, input));
    }
    if ('all' in c) {
      const raw = c['all'];
      const conditions = Array.isArray(raw) ? raw as (string | { [key: string]: unknown })[] : [];
      return conditions.every((sub) => evaluateCondition(sub, input));
    }
    if ('not' in c) {
      return !evaluateCondition(c['not'] as string | { [key: string]: unknown }, input);
    }
    if ('law' in c) {
      const ids = Array.isArray(c['law']) ? c['law'] as string[] : [c['law'] as string];
      return ids.some((id) => (input.lawIds ?? []).includes(id));
    }
    if ('dataType' in c) {
      const ids = Array.isArray(c['dataType']) ? c['dataType'] as string[] : [c['dataType'] as string];
      return ids.some((id) => (input.dataCollected ?? []).includes(id));
    }
    if ('service' in c) {
      const ids = Array.isArray(c['service']) ? c['service'] as string[] : [c['service'] as string];
      return ids.some((id) => (input.serviceIds ?? []).includes(id));
    }
    if ('businessType' in c) {
      const types = Array.isArray(c['businessType']) ? c['businessType'] as string[] : [c['businessType'] as string];
      return types.includes(input.businessType);
    }
    if ('jurisdiction' in c) {
      const jurisdictions = Array.isArray(c['jurisdiction']) ? c['jurisdiction'] as string[] : [c['jurisdiction'] as string];
      return jurisdictions.some((j) => j.toLowerCase() === input.jurisdiction.toLowerCase());
    }
    if ('feature' in c) {
      const ids = Array.isArray(c['feature']) ? c['feature'] as string[] : [c['feature'] as string];
      return ids.some((id) => input.features?.includes(id) ?? false);
    }
    if ('cookieType' in c) {
      const ids = Array.isArray(c['cookieType']) ? c['cookieType'] as string[] : [c['cookieType'] as string];
      return ids.some((id) => input.cookieTypes?.includes(id) ?? false);
    }
  }

  return false;
}

function shouldInclude(section: ClauseSection, input: PolicyInput): boolean {
  return evaluateCondition(section.includeWhen, input);
}

// ---------- Legal text helpers ----------

function buildLegalBasisText(input: PolicyInput): string {
  // Use the law-specific legal basis text if available.
  // Check selected laws in priority order (GDPR first, then LGPD, then DPDP, then others).
  for (const lid of input.lawIds ?? []) {
    const law = lawById(lid);
    if (law && law.legalBasisText) {
      return law.legalBasisText;
    }
  }
  // Fallback if no selected law has specific legal basis text.
  return [
    `Under applicable data protection law, we process your personal data on the following legal bases:`,
    ``,
    `- **Consent**: Where you have given clear consent for us to process your personal data for a specific purpose. You may withdraw your consent at any time.`,
    `- **Contract**: Where processing is necessary for the performance of a contract with you.`,
    `- **Legal obligation**: Where processing is necessary for us to comply with a legal obligation.`,
    `- **Legitimate interests**: Where processing is necessary for our legitimate interests and these interests are not overridden by your rights and freedoms.`,
  ].join('\n');
}

function buildCoppaText(input: PolicyInput): string {
  if (input.businessType === 'mobile-app' || input.businessType === 'ecommerce') {
    return [
      `Our Service is not directed to children under the age of 13. We do not knowingly collect personally identifiable information from children under 13.`,
      ``,
      `In compliance with the Children's Online Privacy Protection Act (COPPA), we:`,
      ``,
      `- Do not condition participation in an activity on collecting more personal information than is reasonably necessary`,
      `- Provide clear notice to parents about our data practices`,
      `- Obtain verifiable parental consent before collecting personal information from children under 13`,
      `- Allow parents to review, update, or delete their child's personal information`,
      ``,
      `If you are a parent or guardian and you believe your child has provided us with Personal Information, please contact us at ${input.contactEmail || 'our contact email'}. If we become aware that we have collected Personal Information from children under 13 without verification of parental consent, we will take steps to remove that information from our servers.`,
    ].join('\n');
  }
  return [
    `Our Service is not intended for use by children under the age of 13. We do not knowingly collect personal information from anyone under 13 years of age, in accordance with the Children's Online Privacy Protection Act (COPPA).`,
    ``,
    `If you are a parent or guardian and you are aware that your child has provided us with Personal Information, please contact us at ${input.contactEmail || 'our contact email'} so that we can take steps to remove that information.`,
  ].join('\n');
}

function buildCcpaText(input: PolicyInput): string {
  return [
    `Under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA), California residents have specific rights regarding their personal information:`,
    ``,
    `- **Right to Know**: You have the right to request that we disclose what personal information we collect, use, disclose, or sell.`,
    `- **Right to Delete**: You have the right to request the deletion of your personal information, subject to certain exceptions.`,
    `- **Right to Opt-Out**: You have the right to opt out of the sale or sharing of your personal information. We do not sell personal information for monetary consideration.`,
    `- **Right to Non-Discrimination**: We will not discriminate against you for exercising any of your CCPA rights.`,
    `- **Right to Correct**: You have the right to request correction of inaccurate personal information.`,
    `- **Right to Limit**: You have the right to limit the use and disclosure of sensitive personal information to that which is necessary to perform the services or provide the goods reasonably expected.`,
  ].join('\n');
}

function buildDpoText(input: PolicyInput): string {
  // Use law-specific DPO text if available from a selected law.
  let lawSpecificText = '';
  if (input.hasDpo) {
    for (const lid of input.lawIds ?? []) {
      const law = lawById(lid);
      if (law && law.dpoText) {
        lawSpecificText = law.dpoText;
        break;
      }
    }
  }

  if (input.hasDpo && input.dpoEmail) {
    const emailReplaced = lawSpecificText
      ? lawSpecificText.replace(/\{\{contactEmail\}\}/g, input.dpoEmail)
      : `For GDPR-related inquiries, you may also contact our Data Protection Officer at ${input.dpoEmail}.`;
    return emailReplaced;
  }
  return `For any privacy-related questions, please contact us at ${input.contactEmail || 'our contact email'}.`;
}

function buildPersonalInfoList(input: PolicyInput, labels?: Record<string, string>): string {
  const dtLabels = labels || dataTypeLabels;
  const items = (input.dataCollected ?? [])
    .filter((d) => dtLabels[d] && d !== 'analytics' && d !== 'cookies' && d !== 'usage-data' && d !== 'device-info' && d !== 'ip-addresses' && d !== 'ads')
    .map((d) => `- ${dtLabels[d]}`);
  if (items.length === 0) {
    return '- We may collect information you voluntarily provide when contacting us or filling out a form on the Service.';
  }
  return items.join('\n');
}

function buildThirdPartyServicesBlock(input: PolicyInput, vars: Record<string, string>): string {
  const services = (input.serviceIds ?? [])
    .map(serviceById)
    .filter((s): s is Service => Boolean(s));
  if (services.length === 0) {
    return 'We do not share your Personal Information with third parties except as necessary to provide our Service or comply with the law.';
  }
  const grouped = new Map<string, Service[]>();
  for (const s of services) {
    const list = grouped.get(s.category) ?? [];
    list.push(s);
    grouped.set(s.category, list);
  }

  const sections: string[] = [
    'The following third-party services may collect or process information when you use our Service. We have categorized them by purpose. Each service may collect information such as your IP address, browser type, device identifiers, and usage data, in accordance with their own privacy practices.',
  ];
  for (const [category, list] of grouped) {
    sections.push(`\n### ${category}\n`);
    for (const s of list) {
      sections.push(`- **${s.name}** — ${s.description} See [${s.name}'s privacy policy](${s.privacyUrl}).`);
      if (s.policyText) {
        sections.push(`\n  ${fillTemplate(s.policyText, vars)}\n`);
      }
    }
  }
  return sections.join('\n');
}

function buildRightsList(input: PolicyInput): string {
  const rights = new Set<string>();
  for (const lid of input.lawIds ?? []) {
    const law = lawById(lid);
    if (!law) continue;
    for (const r of law.rights) rights.add(r);
  }
  if (rights.size === 0) {
    return [
      '- The right to access the personal information we hold about you',
      '- The right to correct inaccurate or incomplete information',
      '- The right to request deletion of your personal information',
    ].join('\n');
  }
  return Array.from(rights).map((r) => `- ${r}`).join('\n');
}

// ---------- Markdown to HTML (light, no deps) ----------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineMarkdownToHtml(line: string): string {
  // bold then italic then code
  let out = escapeHtml(line);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // links [text](url) — only http(s) and mailto
  out = out.replace(/\[([^\]]+)\]\(((?:https?:|mailto:)[^)]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
  return out;
}

export function markdownToHtml(md: string): string {
  if (!md) return '';
  const lines = md.split('\n');
  const out: string[] = [];
  let inList = false;
  let inOrdered = false;

  const closeLists = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
    if (inOrdered) {
      out.push('</ol>');
      inOrdered = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.length === 0) {
      closeLists();
      out.push('');
      continue;
    }
    const h = /^(#{1,6})\s+(.+)$/.exec(line);
    if (h) {
      closeLists();
      const level = h[1]!.length;
      out.push(`<h${level}>${inlineMarkdownToHtml(h[2]!)}</h${level}>`);
      continue;
    }
    const ul = /^[-*]\s+(.+)$/.exec(line);
    if (ul) {
      if (!inList) {
        closeLists();
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inlineMarkdownToHtml(ul[1]!)}</li>`);
      continue;
    }
    const ol = /^\d+\.\s+(.+)$/.exec(line);
    if (ol) {
      if (!inOrdered) {
        closeLists();
        out.push('<ol>');
        inOrdered = true;
      }
      out.push(`<li>${inlineMarkdownToHtml(ol[1]!)}</li>`);
      continue;
    }
    closeLists();
    out.push(`<p>${inlineMarkdownToHtml(line)}</p>`);
  }
  closeLists();
  return out.join('\n');
}

export function markdownToPlainText(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s+/gm, '• ')
    .replace(/^\d+\.\s+/gm, (m) => m)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------- Analytics text ----------

function buildAnalyticsText(input: PolicyInput): string {
  const analyticsServices = (servicesData as Service[])
    .filter(s => s.category === 'Analytics' && (input.serviceIds ?? []).includes(s.id));

  if (analyticsServices.length === 0) {
    return 'We use analytics services to help us understand how users interact with our Service.';
  }

  if (analyticsServices.length === 1) {
    return `Specifically, we use ${analyticsServices[0]!.name}.`;
  }

  const names = analyticsServices.map(s => s.name);
  return `Specifically, we use ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}.`;
}

// ---------- Generator ----------

export function generatePolicy(input: PolicyInput, overrides?: GeneratorOverrides): GeneratedPolicy {
  const generatedAt = new Date().toISOString();
  const bt = businessTypeById(input.businessType);
  const dtLabels = overrides?.dataTypeLabels || dataTypeLabels;
  const vars: Record<string, string> = {
    businessName: input.businessName || 'Our Company',
    websiteUrl: input.websiteUrl || 'our website',
    contactEmail: input.contactEmail || '[contact email]',
    jurisdiction: JURISDICTION_NAMES[input.jurisdiction?.toLowerCase()] || input.jurisdiction || 'the United States',
    personalInfoList: buildPersonalInfoList(input, dtLabels),
    rightsList: buildRightsList(input),
    legalBasisText: buildLegalBasisText(input),
    coppaText: buildCoppaText(input),
    ccpaText: buildCcpaText(input),
    dpoText: buildDpoText(input),
    analyticsText: buildAnalyticsText(input),
  };
  vars.thirdPartyServices = buildThirdPartyServicesBlock(input, vars);

  const clauses = (clausesData as Clauses).sections;
  const included = clauses.filter((s) => shouldInclude(s, input));

  const title = overrides?.title ?? 'Privacy Policy';
  const lastUpdatedLabel = overrides?.lastUpdatedLabel ?? '**Last updated:**';
  const disclaimer = overrides?.disclaimer ?? '> ⚠️ **NOT LEGAL ADVICE.** This policy is a template generated for informational purposes only and does not constitute legal advice. Consult a qualified attorney licensed in your jurisdiction to ensure compliance with all applicable laws and regulations.';

  const parts: string[] = [];
  parts.push(`# ${title}`);
  parts.push('');
  parts.push(`${lastUpdatedLabel} ${formatDate(generatedAt, overrides?.locale)}`);
  parts.push('');
  parts.push(disclaimer);
  parts.push('');

  if (bt) {
    const preambleTmpl = overrides?.preamble ?? '*This policy applies to ' + bt.name.toLowerCase() + ' operated by ' + vars.businessName + '.*';
    const preamble = preambleTmpl
      .replace('{{businessType}}', bt.name.toLowerCase())
      .replace('{{businessName}}', vars.businessName);
    parts.push(preamble);
    parts.push('');
  }

  for (const s of included) {
    parts.push(`## ${overrides?.clauseTitles?.[s.id] ?? s.title}`);
    parts.push('');
    parts.push(fillTemplate(s.body, vars));
    parts.push('');
  }

  const markdown = parts.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  const html = markdownToHtml(markdown);
  const plainText = markdownToPlainText(markdown);
  const hash = encodePolicyToHash(input);

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

// ---------- Hash codec: LZW + base64url ----------

function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
function utf8Decode(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}

function lzwCompress(input: Uint8Array): Uint8Array {
  return pako.deflateRaw(input);
}

function lzwDecompress(input: Uint8Array): Uint8Array {
  return pako.inflateRaw(input);
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodePolicyToHash(input: PolicyInput): string {
  // Compact, deterministic JSON (sorted keys)
  const sorted = Object.keys(input)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      const v = (input as unknown as Record<string, unknown>)[k];
      // Normalize arrays
      if (Array.isArray(v)) acc[k] = [...v].sort();
      else acc[k] = v;
      return acc;
    }, {});
  const json = JSON.stringify(sorted);
  const compressed = lzwCompress(utf8Encode(json));
  return toBase64Url(compressed);
}

export function decodeHashToPolicy(hash: string): PolicyInput | null {
  try {
    // Accept full URL or just hash
    let h = hash.trim();
    if (h.includes('?h=')) h = h.split('?h=').pop()!;
    if (h.includes('#')) h = h.split('#').pop()!;
    const bytes = fromBase64Url(h);
    const json = utf8Decode(lzwDecompress(bytes));
    const parsed = JSON.parse(json) as PolicyInput;
    return parsed;
  } catch {
    return null;
  }
}

// ---------- Re-exports for components that want the data ----------

export const services = servicesData as Service[];
export const laws = lawsData as Law[];
export const businessTypes = businessTypesData as BusinessType[];
export const dataTypeLabel = (id: string) => dataTypeLabels[id] ?? id;
