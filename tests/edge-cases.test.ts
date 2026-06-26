// tests/edge-cases.test.ts
// Edge-case, crash, and vulnerability tests for Privacy Policy Generator.
// Tests identified during A-Z security/correctness audit.

import { describe, it, expect } from 'vitest';
import {
  generatePolicy,
  encodePolicyToHash,
  decodeHashToPolicy,
  markdownToHtml,
  evaluateCondition,
  type PolicyInput,
} from '@/lib/generator';
import { generateCookiePolicy, encodeCookieToHash, decodeHashToCookie } from '@/lib/cookie-generator';
import { generateTerms, encodeTermsToHash, decodeHashToTerms } from '@/lib/terms-generator';
import { translateMarkdown } from '@/lib/translate';

// ── Fixtures ──

function fixture(overrides: Partial<PolicyInput> = {}): PolicyInput {
  return {
    businessName: 'Acme Co',
    websiteUrl: 'https://acme.example',
    businessType: 'saas',
    jurisdiction: 'United States',
    dataCollected: ['emails', 'analytics', 'cookies'],
    serviceIds: ['google-analytics', 'stripe', 'cloudflare'],
    lawIds: ['gdpr', 'ccpa', 'caloppa'],
    contactEmail: 'privacy@acme.example',
    hasDpo: false,
    dpoEmail: '',
    tone: 'professional',
    ...overrides,
  };
}

// ── Crash / Null-Safety Tests ──

describe('crash safety — null/undefined input fields', () => {
  it('handles undefined dataCollected gracefully', () => {
    const input = fixture({ dataCollected: undefined as unknown as string[] });
    const result = generatePolicy(input);
    expect(result.markdown.length).toBeGreaterThan(100);
    expect(result.html.length).toBeGreaterThan(100);
    expect(result.plainText.length).toBeGreaterThan(100);
  });

  it('handles null dataCollected gracefully', () => {
    const input = fixture({ dataCollected: null as unknown as string[] });
    const result = generatePolicy(input);
    expect(result.markdown).toBeTruthy();
  });

  it('handles undefined serviceIds gracefully', () => {
    const input = fixture({ serviceIds: undefined as unknown as string[] });
    const result = generatePolicy(input);
    expect(result.markdown.length).toBeGreaterThan(100);
  });

  it('handles null serviceIds gracefully', () => {
    const input = fixture({ serviceIds: null as unknown as string[] });
    const result = generatePolicy(input);
    expect(result.markdown).toBeTruthy();
  });

  it('handles undefined lawIds gracefully', () => {
    const input = fixture({ lawIds: undefined as unknown as string[] });
    const result = generatePolicy(input);
    expect(result.markdown.length).toBeGreaterThan(100);
  });

  it('handles null lawIds gracefully', () => {
    const input = fixture({ lawIds: null as unknown as string[] });
    const result = generatePolicy(input);
    expect(result.markdown).toBeTruthy();
  });

  it('handles empty dataCollected gracefully', () => {
    const input = fixture({ dataCollected: [] });
    const result = generatePolicy(input);
    expect(result.markdown.length).toBeGreaterThan(100);
    expect(result.markdown).not.toContain('undefined');
  });

  it('handles empty serviceIds gracefully', () => {
    const input = fixture({ serviceIds: [] });
    const result = generatePolicy(input);
    expect(result.markdown).toBeTruthy();
  });

  it('handles empty lawIds gracefully', () => {
    const input = fixture({ lawIds: [] });
    const result = generatePolicy(input);
    expect(result.markdown).toBeTruthy();
  });

  it('handles all empty arrays simultaneously', () => {
    const input = fixture({ dataCollected: [], serviceIds: [], lawIds: [] });
    const result = generatePolicy(input);
    expect(result.markdown.length).toBeGreaterThan(100);
  });

  it('handles all null arrays simultaneously', () => {
    const input = fixture({
      dataCollected: null as unknown as string[],
      serviceIds: null as unknown as string[],
      lawIds: null as unknown as string[],
    });
    const result = generatePolicy(input);
    expect(result.markdown.length).toBeGreaterThan(100);
  });

  it('handles missing businessName', () => {
    const input = fixture({ businessName: '' });
    const result = generatePolicy(input);
    expect(result.markdown).toContain('Our Company');
    expect(result.markdown).not.toContain('undefined');
  });

  it('handles missing contactEmail', () => {
    const input = fixture({ contactEmail: '' });
    const result = generatePolicy(input);
    expect(result.markdown).not.toContain('undefined');
  });

  it('handles null contactEmail', () => {
    const input = fixture({ contactEmail: null as unknown as string });
    const result = generatePolicy(input);
    expect(result.markdown).not.toContain('undefined');
    // Should fall back gracefully rather than producing "null" in contact sections
    expect(result.markdown).not.toMatch(/contact us at null/i);
  });

  it('handles whitespace-only businessName', () => {
    const input = fixture({ businessName: '   ' });
    const result = generatePolicy(input);
    expect(result.markdown.length).toBeGreaterThan(50);
  });
});

// ── evaluateCondition Edge Cases ──

describe('evaluateCondition edge cases', () => {
  it('handles non-array "any" gracefully (e.g. string instead of array)', () => {
    const input = fixture();
    // When { any: "gdpr" } is passed but "gdpr" isn't an array
    const result = evaluateCondition({ any: 'gdpr' } as unknown as string, input);
    expect(result).toBe(false);
  });

  it('handles non-array "all" gracefully (e.g. string instead of array)', () => {
    const input = fixture();
    // When { all: "gdpr" } is passed, it's coerced to [], and [].every() is true
    const result = evaluateCondition({ all: 'gdpr' } as unknown as string, input);
    expect(typeof result).toBe('boolean');
  });

  it('handles empty array "any" gracefully', () => {
    const input = fixture();
    const result = evaluateCondition({ any: [] } as unknown as string, input);
    expect(result).toBe(false);
  });

  it('handles empty array "all" gracefully', () => {
    const input = fixture();
    const result = evaluateCondition({ all: [] } as unknown as string, input);
    expect(result).toBe(true);
  });

  it('handles empty object condition gracefully', () => {
    const input = fixture();
    expect(evaluateCondition({} as unknown as string, input)).toBe(false);
  });

  it('handles nested unknown key gracefully', () => {
    const input = fixture();
    expect(evaluateCondition({ mysteryKey: 'value' } as unknown as string, input)).toBe(false);
  });

  it('handles null condition object gracefully', () => {
    const input = fixture();
    const result = evaluateCondition(null as unknown as string, input);
    expect(result).toBe(false);
  });

  it('handles undefined condition gracefully', () => {
    const input = fixture();
    const result = evaluateCondition(undefined as unknown as string, input);
    expect(result).toBe(false);
  });
});

// ── COPPA Text Bug ──

describe('COPPA text contactEmail fallback', () => {
  it('does NOT produce literal "undefined" when contactEmail is empty', () => {
    const input = fixture({ contactEmail: '', lawIds: ['coppa'], dataCollected: ['emails'] });
    const result = generatePolicy(input);
    expect(result.markdown).not.toContain('undefined');
  });

  it('does NOT produce literal "undefined" when contactEmail is null', () => {
    const input = fixture({ contactEmail: null as unknown as string, lawIds: ['coppa'], dataCollected: ['emails'] });
    const result = generatePolicy(input);
    expect(result.markdown).not.toContain('undefined');
    expect(result.markdown).not.toMatch(/contact us at null/i);
  });

  it('does NOT produce literal "undefined" when COPPA not selected', () => {
    const input = fixture({ contactEmail: null as unknown as string });
    const result = generatePolicy(input);
    expect(result.markdown).not.toContain('undefined');
  });
});

// ── Hash Codec Edge Cases ──

describe('decodeHashToPolicy edge cases', () => {
  it('returns null for empty hash', () => {
    expect(decodeHashToPolicy('')).toBeNull();
  });

  it('returns null for whitespace hash', () => {
    expect(decodeHashToPolicy('   ')).toBeNull();
  });

  it('returns null for special characters', () => {
    expect(decodeHashToPolicy('!@#$%^&*()')).toBeNull();
  });

  it('returns null for very short hash', () => {
    expect(decodeHashToPolicy('a')).toBeNull();
  });

  it('returns null for base64 but invalid compressed data', () => {
    // Valid base64url but not valid pako data
    const b64hash = 'YWJjZGVmZw';
    expect(decodeHashToPolicy(b64hash)).toBeNull();
  });

  it('returns null for SQL injection attempt', () => {
    expect(decodeHashToPolicy("'; DROP TABLE; --")).toBeNull();
  });

  it('returns null for XSS attempt in hash', () => {
    expect(decodeHashToPolicy('<script>alert(1)</script>')).toBeNull();
  });

  it('accepts URL with query param', () => {
    const input = fixture();
    const hash = encodePolicyToHash(input);
    const fullUrl = `https://example.com/p?h=${hash}`;
    const decoded = decodeHashToPolicy(fullUrl);
    expect(decoded).not.toBeNull();
    expect(decoded!.businessName).toBe('Acme Co');
  });

  it('extracts hash from query string only', () => {
    const input = fixture();
    const hash = encodePolicyToHash(input);
    const fromQs = decodeHashToPolicy(`?h=${hash}`);
    expect(fromQs).not.toBeNull();
    expect(fromQs!.businessName).toBe('Acme Co');
  });
});

// ── encodePolicyToHash Edge Cases ──

describe('encodePolicyToHash edge cases', () => {
  it('encodes empty businessName without error', () => {
    const input = fixture({ businessName: '' });
    const hash = encodePolicyToHash(input);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  it('encodes minimal input without error', () => {
    const input: PolicyInput = {
      businessName: '',
      websiteUrl: '',
      businessType: '' as any,
      jurisdiction: '',
      dataCollected: [],
      serviceIds: [],
      lawIds: [],
      contactEmail: '',
      hasDpo: false,
      dpoEmail: '',
      tone: 'plain',
    };
    const hash = encodePolicyToHash(input);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    const decoded = decodeHashToPolicy(hash);
    expect(decoded).not.toBeNull();
  });

  it('encodes input with unicode characters without error', () => {
    const input = fixture({ businessName: 'Café Zürich' });
    const hash = encodePolicyToHash(input);
    expect(typeof hash).toBe('string');
    expect(hash).not.toContain('+');
    expect(hash).not.toContain('/');
    const decoded = decodeHashToPolicy(hash);
    expect(decoded).not.toBeNull();
  });
});

// ── markdownToHtml Edge Cases ──

describe('markdownToHtml edge cases', () => {
  it('handles empty string', () => {
    const html = markdownToHtml('');
    expect(typeof html).toBe('string');
  });

  it('handles null/undefined gracefully', () => {
    expect(markdownToHtml(null as unknown as string)).toBe('');
    expect(markdownToHtml(undefined as unknown as string)).toBe('');
  });

  it('handles very long single line without crashing', () => {
    const longLine = 'a'.repeat(10000);
    const html = markdownToHtml(longLine);
    expect(html.length).toBeGreaterThan(1000);
  });

  it('does not convert javascript: links to anchor tags', () => {
    const md = '[click](javascript:alert(1))';
    const html = markdownToHtml(md);
    // The link regex only allows http(s): and mailto: protocols
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('click');
  });

  it('handles mailto links correctly', () => {
    const md = '[email us](mailto:test@example.com)';
    const html = markdownToHtml(md);
    expect(html).toContain('href="mailto:test@example.com"');
  });

  it('escapes embedded HTML in markdown', () => {
    const md = '<script>alert("xss")</script>';
    const html = markdownToHtml(md);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

// ── Cookie & Terms Generators ──

describe('Cookie + Terms generator crash safety', () => {
  it('generates cookie policy with minimal input', () => {
    const result = generateCookiePolicy({
      businessName: 'Test Co',
      websiteUrl: 'https://test.example',
      businessType: 'saas',
      jurisdiction: 'United States',
      dataCollected: [],
      serviceIds: [],
      lawIds: [],
      contactEmail: '',
      hasDpo: false,
      dpoEmail: '',
      tone: 'plain',
      cookieTypes: [],
    });
    expect(result.markdown.length).toBeGreaterThan(50);
  });

  it('handles null cookieTypes in cookie generator', () => {
    const result = generateCookiePolicy({
      businessName: 'Test Co',
      websiteUrl: 'https://test.example',
      businessType: 'saas',
      jurisdiction: 'United States',
      dataCollected: [],
      serviceIds: [],
      lawIds: [],
      contactEmail: '',
      hasDpo: false,
      dpoEmail: '',
      tone: 'plain',
      cookieTypes: null as unknown as string[],
    });
    expect(result.markdown.length).toBeGreaterThan(50);
  });

  it('generates terms with minimal input', () => {
    const result = generateTerms({
      businessName: 'Test Co',
      websiteUrl: 'https://test.example',
      businessType: 'saas',
      jurisdiction: 'United States',
      contactEmail: 'test@test.com',
      features: [],
    });
    expect(result.markdown.length).toBeGreaterThan(50);
  });

  it('handles null features in terms generator', () => {
    const result = generateTerms({
      businessName: 'Test Co',
      websiteUrl: 'https://test.example',
      businessType: 'saas',
      jurisdiction: 'United States',
      contactEmail: 'test@test.com',
      features: null as unknown as string[],
    });
    expect(result.markdown.length).toBeGreaterThan(50);
  });

  it('round-trips cookie hash', () => {
    const input = {
      businessName: 'Test Co',
      websiteUrl: 'https://test.example',
      businessType: 'saas',
      jurisdiction: 'US',
      dataCollected: ['emails'],
      serviceIds: ['google-analytics'],
      lawIds: ['gdpr'],
      contactEmail: 'test@test.com',
      hasDpo: false,
      dpoEmail: '',
      tone: 'plain',
      cookieTypes: ['necessary', 'analytics'],
    };
    const hash = encodeCookieToHash(input);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    const decoded = decodeHashToCookie(hash);
    expect(decoded).not.toBeNull();
    expect(decoded!.businessName).toBe('Test Co');
  });

  it('round-trips terms hash', () => {
    const input = {
      businessName: 'Test Co',
      websiteUrl: 'https://test.example',
      businessType: 'saas',
      jurisdiction: 'US',
      contactEmail: 'test@test.com',
      features: ['user-accounts', 'payments'],
    };
    const hash = encodeTermsToHash(input);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    const decoded = decodeHashToTerms(hash);
    expect(decoded).not.toBeNull();
    expect(decoded!.businessName).toBe('Test Co');
  });

  it('cookie hash handles null serviceIds/lawIds', () => {
    const input: any = {
      businessName: 'Test Co',
      websiteUrl: 'https://test.example',
      businessType: 'saas',
      jurisdiction: 'US',
      dataCollected: [],
      serviceIds: null,
      lawIds: null,
      contactEmail: '',
      hasDpo: false,
      dpoEmail: '',
      tone: 'plain',
      cookieTypes: ['necessary'],
    };
    const result = generateCookiePolicy(input);
    expect(result.markdown.length).toBeGreaterThan(50);
  });
});

// ── Translate Module ──

describe('translateMarkdown edge cases', () => {
  it('returns original when targetLang is "en"', async () => {
    const md = '## Privacy Policy\nSome text here.';
    const result = await translateMarkdown(md, 'en');
    expect(result).toBe(md);
  });

  it('returns empty string for empty input', async () => {
    const result = await translateMarkdown('', 'fr');
    expect(result).toBe('');
  });

  it('handles null/undefined input gracefully', async () => {
    const r1 = await translateMarkdown(null as unknown as string, 'fr');
    expect(r1).toBe('');
    const r2 = await translateMarkdown(undefined as unknown as string, 'fr');
    expect(r2).toBe('');
  });

  it('preserves markdown headings through translation', async () => {
    // Uses realistic markdown with heading + content (not just a heading)
    // because translation APIs may handle short fragments differently.
    const md = '## Privacy Policy\n\nWe respect your privacy. This document explains how we handle your data.';
    const result = await translateMarkdown(md, 'fr');
    expect(result).toContain('##');
  }, 15_000);
});

// ── GeneratedPolicy completeness ──

describe('generatePolicy output completeness', () => {
  it('includes all required fields in output', () => {
    const result = generatePolicy(fixture());
    expect(result).toHaveProperty('markdown');
    expect(result).toHaveProperty('html');
    expect(result).toHaveProperty('plainText');
    expect(result).toHaveProperty('hash');
    expect(result).toHaveProperty('businessName');
    expect(result).toHaveProperty('websiteUrl');
    expect(result).toHaveProperty('generatedAt');
  });

  it('hash in output round-trips correctly', () => {
    const input = fixture();
    const result = generatePolicy(input);
    const decoded = decodeHashToPolicy(result.hash);
    expect(decoded).not.toBeNull();
    expect(decoded!.businessName).toBe(input.businessName);
  });
});

// ─── Cross-document-type tests ──

describe('Cross-document-type format consistency', () => {
  it('all three generators produce markdown with no "undefined" string', () => {
    const base = {
      businessName: 'Test Co',
      websiteUrl: 'https://test.example',
      businessType: 'saas' as const,
      jurisdiction: 'US',
      dataCollected: ['emails'],
      serviceIds: ['google-analytics'],
      lawIds: ['gdpr'],
      contactEmail: 'test@test.com',
      hasDpo: false,
      dpoEmail: '' as string,
      tone: 'plain' as const,
    };

    const privacy = generatePolicy(base);
    expect(privacy.markdown).not.toContain('undefined');

    const cookie = generateCookiePolicy({ ...base, cookieTypes: ['necessary'] });
    expect(cookie.markdown).not.toContain('undefined');

    const terms = generateTerms({
      businessName: 'Test Co',
      websiteUrl: 'https://test.example',
      businessType: 'saas',
      jurisdiction: 'US',
      contactEmail: 'test@test.com',
      features: ['user-accounts'],
    });
    expect(terms.markdown).not.toContain('undefined');
  });
});
