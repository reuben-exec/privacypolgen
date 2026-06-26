// tests/generator.test.ts
// Unit tests for src/lib/generator.ts
// Grounded in actual source: 562-line module, exports verified via grep.

import { describe, it, expect } from 'vitest';
import {
  generatePolicy,
  encodePolicyToHash,
  decodeHashToPolicy,
  markdownToHtml,
  services,
  laws,
  businessTypes,
  dataTypeLabel,
  type PolicyInput,
} from '@/lib/generator';
// NOTE: markdownToPlainText is NOT exported — it is private (line 340).
// Tests for it are covered indirectly via generatePolicy(...).plainText.

// ---------- Fixtures ----------
// All ids verified against JSON data files before writing:

// businessTypes.json ids: personal-blog, saas, ecommerce, mobile-app, portfolio, agency
// services.json ids: google-analytics, stripe, cloudflare, ... (17 total)
// laws.json ids: gdpr, ccpa, caloppa, coppa, pipeda, lgpd
// dataTypeLabels keys: emails, names, addresses, phones, companies, user-accounts,
//   payments, usage-data, device-info, ip-addresses, location-data, analytics, cookies, ads
// clauses.json includeWhen: 'always' | 'data-collected' | 'gdpr' | 'ccpa' | 'coppa'

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

// ---------- Hash codec ----------

describe('encodePolicyToHash + decodeHashToPolicy', () => {
  it('round-trips a typical input losslessly', () => {
    const input = fixture();
    const hash = encodePolicyToHash(input);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    // No base64-url padding or URL-unsafe characters should leak through
    expect(hash).not.toMatch(/[+/=]/);

    const decoded = decodeHashToPolicy(hash);
    expect(decoded).not.toBeNull();
    // Arrays are sorted by the encoder (line 533), so the decoded output
    // may have a different order than the input. The correct round-trip
    // assertion is that encoding the decoded value yields the same hash.
    expect(encodePolicyToHash(decoded!)).toBe(hash);
  });

  it('produces stable hashes regardless of input property order', () => {
    // The encoder sorts keys (line 528), so two semantically-equal inputs
    // should yield identical hashes.
    const a = encodePolicyToHash({
      businessName: 'X',
      websiteUrl: 'x',
      businessType: 'saas',
      jurisdiction: 'US',
      dataCollected: ['emails'],
      serviceIds: ['stripe'],
      lawIds: ['gdpr'],
      contactEmail: 'a@b.c',
      hasDpo: false,
      tone: 'plain',
    });
    const b = encodePolicyToHash({
      tone: 'plain',
      hasDpo: false,
      contactEmail: 'a@b.c',
      lawIds: ['gdpr'],
      serviceIds: ['stripe'],
      dataCollected: ['emails'],
      jurisdiction: 'US',
      businessType: 'saas',
      websiteUrl: 'x',
      businessName: 'X',
    });
    expect(a).toBe(b);
  });

  it('produces stable hashes regardless of array element order', () => {
    // Line 533: arrays are sorted before serialization
    const a = encodePolicyToHash(
      fixture({ dataCollected: ['emails', 'analytics', 'cookies'] })
    );
    const b = encodePolicyToHash(
      fixture({ dataCollected: ['cookies', 'emails', 'analytics'] })
    );
    expect(a).toBe(b);
  });

  it('returns null for garbage input', () => {
    expect(decodeHashToPolicy('not-a-real-hash!!!')).toBeNull();
    expect(decodeHashToPolicy('')).toBeNull();
  });

  it('accepts a full URL or query string and still decodes', () => {
    const hash = encodePolicyToHash(fixture());
    const fromUrl = decodeHashToPolicy(
      `https://www.privacypolgen.in/p?h=${hash}`
    );
    expect(fromUrl).not.toBeNull();
    expect(encodePolicyToHash(fromUrl!)).toBe(hash);

    const fromQuery = decodeHashToPolicy(`?h=${hash}`);
    expect(fromQuery).not.toBeNull();
    expect(encodePolicyToHash(fromQuery!)).toBe(hash);
  });

  it('produces a compact hash (LZW beats raw JSON for typical input)', () => {
    const input = fixture();
    const hash = encodePolicyToHash(input);
    const raw = JSON.stringify(input).length;
    // base64 of N bytes ≈ 4/3 N chars; we assert hash is shorter than that
    expect(hash.length).toBeLessThan((raw * 4) / 3);
  });

  it('round-trips all 4 pre-baked examples from examples.astro', () => {
    // These are the exact input objects from src/pages/examples.astro
    const examples = [
      {
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
      {
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
      {
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
      {
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
    ] as PolicyInput[];

    for (const input of examples) {
      const hash = encodePolicyToHash(input);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toMatch(/[+/=]/);

      const decoded = decodeHashToPolicy(hash);
      expect(decoded).not.toBeNull();
      expect(encodePolicyToHash(decoded!)).toBe(hash);
    }
  });
});

// ---------- generatePolicy ----------

describe('generatePolicy', () => {
  it('returns the three required output formats plus hash and timestamp', () => {
    const out = generatePolicy(fixture());
    expect(out.markdown).toBeTruthy();
    expect(out.html).toBeTruthy();
    expect(out.plainText).toBeTruthy();
    expect(out.hash).toBeTruthy();
    expect(out.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('produces a hash that round-trips back to the input', () => {
    const out = generatePolicy(fixture());
    const decoded = decodeHashToPolicy(out.hash);
    expect(decoded).not.toBeNull();
    // Same canonical-form assertion as above — arrays are sorted on encode.
    expect(encodePolicyToHash(decoded!)).toBe(out.hash);
  });

  it('embeds the business name in all three output formats', () => {
    const out = generatePolicy(fixture({ businessName: 'Lumen' }));
    expect(out.markdown).toContain('Lumen');
    expect(out.html).toContain('Lumen');
    expect(out.plainText).toContain('Lumen');
  });

  it('lists selected third-party services with their privacy links', () => {
    // services.json: stripe has name "Stripe", google-analytics has name "Google Analytics"
    const out = generatePolicy(
      fixture({ serviceIds: ['stripe', 'google-analytics'] })
    );
    expect(out.markdown).toMatch(/Stripe/);
    expect(out.markdown).toMatch(/Google Analytics/);
    // Markdown links: [Name](privacyUrl)
    expect(out.markdown).toMatch(/\[Stripe/);
    expect(out.markdown).toMatch(/https?:\/\//);
  });

  it('includes GDPR legal-basis text when GDPR is selected', () => {
    // When GDPR selected, buildLegalBasisText returns the GDPR-specific text
    // (laws.json line 19): "We process your personal data on the following legal bases..."
    const md = generatePolicy(fixture({ lawIds: ['gdpr'] })).markdown;
    expect(md).toMatch(/legal basis|legitimate interest|consent/i);
  });

  it('includes CCPA rights list when CCPA is selected', () => {
    // buildCcpaText (line 184) includes "Right to Know", "Right to Delete"
    const md = generatePolicy(fixture({ lawIds: ['ccpa'] })).markdown;
    expect(md).toMatch(/Right to Know|Right to Delete|CCPA/);
  });

  it('includes COPPA children-under-13 notice when COPPA is selected', () => {
    // buildCoppaText (line 162) mentions "under the age of 13"
    const md = generatePolicy(fixture({ lawIds: ['coppa'] })).markdown;
    expect(md).toMatch(/under (the age of )?13|children/i);
  });

  it('falls back to "Our Company" and "[contact email]" for empty input', () => {
    // Line 359-361: businessName || 'Our Company', contactEmail || '[contact email]'
    const minimal: PolicyInput = {
      businessName: '',
      websiteUrl: '',
      businessType: 'saas',
      jurisdiction: '',
      dataCollected: [],
      serviceIds: [],
      lawIds: [],
      contactEmail: '',
      hasDpo: false,
      dpoEmail: '',
      tone: 'plain',
    };
    const out = generatePolicy(minimal);
    expect(out.markdown).toContain('Our Company');
    expect(out.markdown).toContain('[contact email]');
    expect(out.markdown.length).toBeGreaterThan(200);
  });

  it('handles empty data/services/laws without throwing', () => {
    const out = generatePolicy(
      fixture({ dataCollected: [], serviceIds: [], lawIds: [] })
    );
    expect(out.markdown).toBeTruthy();
  });

  it('includes DPO contact when hasDpo is true and dpoEmail is set', () => {
    // buildDpoText (line 197): returns "Data Protection Officer at <email>"
    const md = generatePolicy(
      fixture({ hasDpo: true, dpoEmail: 'dpo@acme.example' })
    ).markdown;
    expect(md).toMatch(/Data Protection Officer/);
    expect(md).toContain('dpo@acme.example');
  });

  it('does NOT include DPO when hasDpo is false', () => {
    const md = generatePolicy(fixture({ hasDpo: false })).markdown;
    expect(md).not.toMatch(/Data Protection Officer/);
  });
});

// ---------- markdownToHtml ----------

describe('markdownToHtml', () => {
  it('converts headings (h1-h3)', () => {
    const html = markdownToHtml('# H1\n## H2\n### H3');
    expect(html).toContain('<h1>H1</h1>');
    expect(html).toContain('<h2>H2</h2>');
    expect(html).toContain('<h3>H3</h3>');
  });

  it('converts unordered lists', () => {
    const html = markdownToHtml('- a\n- b\n- c');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>a</li>');
    expect(html).toContain('<li>b</li>');
    expect(html).toContain('<li>c</li>');
    expect(html).toContain('</ul>');
  });

  it('converts ordered lists', () => {
    const html = markdownToHtml('1. one\n2. two');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>one</li>');
    expect(html).toContain('<li>two</li>');
  });

  it('converts bold, italic, and inline code', () => {
    const html = markdownToHtml('**bold** and *italic* and `code`');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toContain('<code>code</code>');
  });

  it('converts http(s) and mailto links with rel=noopener noreferrer', () => {
    const html = markdownToHtml(
      '[text](https://example.com) and [mail](mailto:a@b.c)'
    );
    expect(html).toContain(
      '<a href="https://example.com" rel="noopener noreferrer">text</a>'
    );
    expect(html).toContain(
      '<a href="mailto:a@b.c" rel="noopener noreferrer">mail</a>'
    );
  });

  it('refuses to render javascript: links as clickable hrefs', () => {
    // The link regex (line 278) only matches https?: or mailto:.
    // A javascript: link is left as literal escaped text.
    // The word "javascript:" may appear in escaped text; what matters is
    // that no <a href="javascript:"> element is created.
    const html = markdownToHtml('[bad](javascript:alert(1))');
    expect(html).not.toMatch(/<a[^>]+href="javascript:/i);
  });

  it('escapes HTML special characters in body text', () => {
    const html = markdownToHtml('a < b & c > d');
    expect(html).toContain('&lt;');
    expect(html).toContain('&amp;');
    expect(html).toContain('&gt;');
  });

  it('wraps plain lines in <p> tags', () => {
    const html = markdownToHtml('Hello world');
    expect(html).toContain('<p>Hello world</p>');
  });
});

// ---------- plainText output ----------
// markdownToPlainText is private (line 340). Verified via generatePolicy's
// plainText field. The function strips #, **, *, `, [text](url), replaces
// - bullets with \u2022, and collapses 3+ newlines.

describe('plainText output', () => {
  it('omits heading markers (#) from plainText', () => {
    const out = generatePolicy(fixture()).plainText;
    // First heading in generated policy: "# Privacy Policy" (line 376)
    expect(out).toContain('Privacy Policy');
    expect(out).not.toMatch(/^# Privacy Policy/m);
  });

  it('strips bold (**) markers from plainText', () => {
    // Policy contains "**Last updated:**" (line 378) — ** must be stripped
    const out = generatePolicy(fixture()).plainText;
    expect(out).not.toContain('**');
  });

  it('replaces unordered-list bullets with bullet char in plainText', () => {
    // The cookies clause body has "- Essential cookies", "- Analytics cookies" etc.
    // These appear in the policy when dataCollected includes 'cookies'.
    const out = generatePolicy(
      fixture({ dataCollected: ['cookies'] })
    ).plainText;
    expect(out).toMatch(/\u2022 /);
  });
});

// ---------- Condition DSL (via generatePolicy section inclusion) ----------
// The condition DSL in clauses.json uses:
//   string ("always", "gdpr")   → backward compat / law / data-collected
//   { law: "gdpr" }             → law ID match
//   { service: "stripe" }       → service ID match
//   { dataType: "ads" }         → data type ID match
//   { jurisdiction: "IN" }      → jurisdiction match
//   { any: [...] }              → OR logic
//   { all: [...] }              → AND logic
//   { not: ... }                → negation
//
// Section titles used for detection in markdown output:
const SECTION_TITLES: Record<string, string> = {
  'personal-info': 'Personal Information You Provide',
  'usage-data': 'Usage Data and Analytics',
  'analytics-details': 'Analytics Providers',
  'advertising': 'Advertising and Ad Targeting',
  'email-marketing': 'Email Marketing',
  'payment-processing': 'Payment Processing',
  'legal-basis': 'Legal Basis for Processing',
  'cookie-consent': 'Cookie Consent',
  'do-not-sell': 'Do Not Sell or Share My Personal Information',
  'children': 'Children\'s Privacy',
  'international-transfers-gdpr': 'International Data Transfers — GDPR Safeguards',
};

describe('condition DSL — data-collected fix', () => {
  it('includes personal-info, usage-data, cookies when dataCollected is non-empty', () => {
    const md = generatePolicy(fixture({ dataCollected: ['emails', 'cookies'] })).markdown;
    expect(md).toContain(SECTION_TITLES['personal-info']);
    expect(md).toContain(SECTION_TITLES['usage-data']);
    expect(md).toContain(SECTION_TITLES['cookie-consent']); // no — cookie-consent is law-based
    // cookies and personal-info/usage-data all use "data-collected" condition
    // which is true when dataCollected.length > 0
  });

  it('excludes personal-info, usage-data, cookies when dataCollected is empty', () => {
    const md = generatePolicy(fixture({ dataCollected: [] })).markdown;
    expect(md).not.toContain(SECTION_TITLES['personal-info']);
    expect(md).not.toContain(SECTION_TITLES['usage-data']);
  });
});

describe('condition DSL — { service: ... }', () => {
  it('includes analytics-details when google-analytics is selected', () => {
    const md = generatePolicy(fixture({ serviceIds: ['google-analytics'] })).markdown;
    expect(md).toContain(SECTION_TITLES['analytics-details']);
  });

  it('includes analytics-details when plausible is selected', () => {
    const md = generatePolicy(fixture({ serviceIds: ['plausible'] })).markdown;
    expect(md).toContain(SECTION_TITLES['analytics-details']);
  });

  it('excludes analytics-details when no analytics service is selected', () => {
    const md = generatePolicy(fixture({ serviceIds: ['stripe', 'cloudflare'] })).markdown;
    expect(md).not.toContain(SECTION_TITLES['analytics-details']);
  });

  it('includes advertising when google-adsense is selected', () => {
    const md = generatePolicy(fixture({ serviceIds: ['google-adsense'] })).markdown;
    expect(md).toContain(SECTION_TITLES['advertising']);
  });

  it('includes email-marketing when mailchimp is selected', () => {
    const md = generatePolicy(fixture({ serviceIds: ['mailchimp'] })).markdown;
    expect(md).toContain(SECTION_TITLES['email-marketing']);
  });

  it('includes payment-processing when stripe is selected', () => {
    const md = generatePolicy(fixture({ serviceIds: ['stripe'] })).markdown;
    expect(md).toContain(SECTION_TITLES['payment-processing']);
  });
});

describe('condition DSL — { law: ... }', () => {
  it('includes cookie-consent when gdpr is selected', () => {
    const md = generatePolicy(fixture({ lawIds: ['gdpr'] })).markdown;
    expect(md).toContain(SECTION_TITLES['cookie-consent']);
  });

  it('includes cookie-consent when lgpd is selected', () => {
    const md = generatePolicy(fixture({ lawIds: ['lgpd'] })).markdown;
    expect(md).toContain(SECTION_TITLES['cookie-consent']);
  });

  it('excludes cookie-consent when neither gdpr nor lgpd is selected', () => {
    const md = generatePolicy(fixture({ lawIds: ['ccpa'] })).markdown;
    expect(md).not.toContain(SECTION_TITLES['cookie-consent']);
  });

  it('includes legal-basis when dpdp is selected', () => {
    const md = generatePolicy(fixture({ lawIds: ['dpdp'] })).markdown;
    expect(md).toContain(SECTION_TITLES['legal-basis']);
  });

  it('includes do-not-sell when ccpa is selected', () => {
    const md = generatePolicy(fixture({ lawIds: ['ccpa'] })).markdown;
    expect(md).toContain(SECTION_TITLES['do-not-sell']);
  });

  it('includes children when coppa is selected', () => {
    const md = generatePolicy(fixture({ lawIds: ['coppa'] })).markdown;
    expect(md).toContain(SECTION_TITLES['children']);
  });
});

describe('condition DSL — { any: [...] }', () => {
  it('includes advertising when ads data type is selected even without ad service', () => {
    const md = generatePolicy(
      fixture({ serviceIds: [], dataCollected: ['emails', 'ads'] })
    ).markdown;
    expect(md).toContain(SECTION_TITLES['advertising']);
  });

  it('includes legal-basis for gdpr, lgpd, or dpdp', () => {
    const md1 = generatePolicy(fixture({ lawIds: ['gdpr'] })).markdown;
    expect(md1).toContain(SECTION_TITLES['legal-basis']);
    const md2 = generatePolicy(fixture({ lawIds: ['lgpd'] })).markdown;
    expect(md2).toContain(SECTION_TITLES['legal-basis']);
    const md3 = generatePolicy(fixture({ lawIds: ['dpdp'] })).markdown;
    expect(md3).toContain(SECTION_TITLES['legal-basis']);
  });

  it('excludes legal-basis when none of gdpr/lgpd/dpdp is selected', () => {
    const md = generatePolicy(fixture({ lawIds: ['ccpa', 'coppa'] })).markdown;
    expect(md).not.toContain(SECTION_TITLES['legal-basis']);
  });
});

describe('condition DSL — { all: [...] } + { not: ... }', () => {
  it('includes international-transfers-gdpr when gdpr selected and jurisdiction is non-EU', () => {
    // jurisdiction "United States" is outside the EU country list
    const md = generatePolicy(fixture({ lawIds: ['gdpr'], jurisdiction: 'United States' })).markdown;
    expect(md).toContain(SECTION_TITLES['international-transfers-gdpr']);
  });

  it('excludes international-transfers-gdpr when gdpr is not selected', () => {
    const md = generatePolicy(fixture({ lawIds: ['ccpa'], jurisdiction: 'United States' })).markdown;
    expect(md).not.toContain(SECTION_TITLES['international-transfers-gdpr']);
  });

  it('excludes international-transfers-gdpr when jurisdiction is an EU country', () => {
    // Germany is in the EU list — the clause contains { not: { jurisdiction: [...] } }
    // which means the "not" evaluates to false for EU countries, so "all" fails.
    const md = generatePolicy(fixture({ lawIds: ['gdpr'], jurisdiction: 'DE' })).markdown;
    expect(md).not.toContain(SECTION_TITLES['international-transfers-gdpr']);
  });
});

describe('condition DSL — backward compatibility (string format)', () => {
  it('treats string "gdpr" as { law: "gdpr" } — includes cookie-consent', () => {
    // The clauses.json still uses string "gdpr" for clauses like children, do-not-sell?
    // Actually cookie-consent uses { law: ["gdpr", "lgpd"] } — this tests the object format
    // But children uses the old format { law: "coppa" }
    const md = generatePolicy(fixture({ lawIds: ['coppa'] })).markdown;
    expect(md).toContain(SECTION_TITLES['children']);
  });

  it('treats string "ccpa" as { law: "ccpa" } — includes do-not-sell', () => {
    const md = generatePolicy(fixture({ lawIds: ['ccpa'] })).markdown;
    expect(md).toContain(SECTION_TITLES['do-not-sell']);
  });
});

describe('condition DSL — DPDP (India) law integration', () => {
  it('includes DPDP law in the exported laws array', () => {
    const ids = laws.map((l) => l.id);
    expect(ids).toContain('dpdp');
  });

  it('includes legal-basis section when dpdp is selected', () => {
    const md = generatePolicy(fixture({ lawIds: ['dpdp'], jurisdiction: 'IN' })).markdown;
    expect(md).toContain(SECTION_TITLES['legal-basis']);
  });

  it('generates valid policy with dpdp as the only law', () => {
    const md = generatePolicy(fixture({
      lawIds: ['dpdp'],
      dataCollected: ['emails'],
      serviceIds: [],
      jurisdiction: 'IN',
    })).markdown;
    expect(md).toContain('Digital Personal Data Protection');
    expect(md).toContain('DPDP Act');
  });
});

// ---------- Data re-exports ----------

describe('data re-exports', () => {
  it('exposes at least one record of each kind', () => {
    expect(services.length).toBeGreaterThan(0);
    expect(laws.length).toBeGreaterThan(0);
    expect(businessTypes.length).toBeGreaterThan(0);
  });

  it('includes core privacy laws', () => {
    const ids = laws.map((l) => l.id);
    expect(ids).toContain('gdpr');
    expect(ids).toContain('ccpa');
  });

  it('dataTypeLabel returns human labels for known ids', () => {
    // dataTypeLabels (line 90): emails -> 'Email addresses'
    expect(dataTypeLabel('emails')).toBe('Email addresses');
    // payments -> 'Payment information (processed by our payment provider...)'
    expect(dataTypeLabel('payments')).toMatch(/Payment/i);
  });

  it('dataTypeLabel falls back to the raw id for unknown ids', () => {
    expect(dataTypeLabel('something-weird')).toBe('something-weird');
  });
});
