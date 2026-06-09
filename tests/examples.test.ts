// tests/examples.test.ts
// Verifies that all 4 pre-baked examples in examples.astro can encode → decode → generate.
import { describe, it, expect } from 'vitest';
import { encodePolicyToHash, decodeHashToPolicy, generatePolicy } from '@/lib/generator';

const examples = [
  {
    name: 'Personal blog with newsletter',
    input: {
      businessName: 'Quiet Letters',
      websiteUrl: 'https://quietletters.example',
      businessType: 'personal-blog',
      jurisdiction: 'United States',
      dataCollected: ['emails', 'analytics', 'cookies'],
      serviceIds: ['plausible', 'mailchimp', 'cloudflare'],
      lawIds: ['gdpr', 'ccpa', 'caloppa'],
      contactEmail: 'hello@quietletters.example',
      hasDpo: false,
      tone: 'professional',
    },
  },
  {
    name: 'SaaS application with payments',
    input: {
      businessName: 'Lumen',
      websiteUrl: 'https://lumen.example',
      businessType: 'saas',
      jurisdiction: 'United States',
      dataCollected: ['emails', 'names', 'user-accounts', 'payments', 'usage-data', 'analytics', 'cookies', 'device-info'],
      serviceIds: ['google-analytics', 'stripe', 'sendgrid', 'aws', 'cloudflare'],
      lawIds: ['gdpr', 'ccpa', 'caloppa', 'pipeda'],
      contactEmail: 'privacy@lumen.example',
      hasDpo: true,
      dpoEmail: 'dpo@lumen.example',
      tone: 'professional',
    },
  },
  {
    name: 'E-commerce store with ads',
    input: {
      businessName: 'Northwind Goods',
      websiteUrl: 'https://shop.northwind.example',
      businessType: 'ecommerce',
      jurisdiction: 'United States',
      dataCollected: ['emails', 'names', 'addresses', 'phones', 'payments', 'analytics', 'cookies', 'ads'],
      serviceIds: ['google-analytics', 'stripe', 'paypal', 'google-adsense', 'facebook-pixel', 'cloudflare'],
      lawIds: ['gdpr', 'ccpa', 'caloppa', 'coppa'],
      contactEmail: 'privacy@shop.northwind.example',
      hasDpo: false,
      tone: 'professional',
    },
  },
  {
    name: 'Mobile app with analytics',
    input: {
      businessName: 'Trailhead',
      websiteUrl: 'https://trailhead.example',
      businessType: 'mobile-app',
      jurisdiction: 'Brazil',
      dataCollected: ['emails', 'user-accounts', 'usage-data', 'analytics', 'device-info', 'location-data'],
      serviceIds: ['mixpanel', 'sendgrid', 'aws'],
      lawIds: ['gdpr', 'ccpa', 'caloppa', 'lgpd'],
      contactEmail: 'privacy@trailhead.example',
      hasDpo: false,
      tone: 'professional',
    },
  },
];

describe('Pre-baked example policies (as in examples.astro)', () => {
  for (const ex of examples) {
    it(`${ex.name}: encode → decode → generate`, () => {
      const hash = encodePolicyToHash(ex.input as any);
      expect(hash).toBeTruthy();
      expect(hash.length).toBeGreaterThan(10);

      const decoded = decodeHashToPolicy(hash);
      expect(decoded).not.toBeNull();
      expect(decoded!.businessName).toBe(ex.input.businessName);

      const policy = generatePolicy(decoded!);
      expect(policy.businessName).toBe(ex.input.businessName);
      expect(policy.markdown.length).toBeGreaterThan(100);
      expect(policy.html.length).toBeGreaterThan(100);
      expect(policy.plainText.length).toBeGreaterThan(100);
    });
  }

  it('Personal blog hash should be stable across builds', () => {
    const hash1 = encodePolicyToHash(examples[0].input as any);
    const hash2 = encodePolicyToHash(examples[0].input as any);
    expect(hash1).toBe(hash2);
  });

  it('All 4 hashes should be unique', () => {
    const hashes = examples.map((ex) => encodePolicyToHash(ex.input as any));
    const unique = new Set(hashes);
    expect(unique.size).toBe(4);
  });
});
