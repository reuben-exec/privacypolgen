# PrivacyPolGen — Build Plan (v2.0 Roadmap)

> **Status**: v1.0 MVP deployed — core pages, 5-step wizard, i18n in 17 languages,
> client-side generator, shareable hash links, dark mode, LemonSqueezy scaffolding.
> Next: Global SaaS launch with AdSense monetisation.

---

## Priority Framework (Descending)

Priorities are ordered by: (1) Legal/operational risk reduction, (2) Competitive
differentiation, (3) AdSense/traffic monetisation enablement.

### P0 — Legal Shield + Intelligent Generator (Launch Blockers)

These are minimum-viable before the product can be marketed to a global SaaS
audience with real legal exposure.

1. **Fix `[Your Jurisdiction]` in Terms (P0.legal)** — Replace the placeholder
   with the owner's real jurisdiction. Single-line change in `terms.astro`
   (Section 10). Exposes liability until fixed.

2. **~~Conditional clause engine (P0.engine)~~** ✅ **DONE**
   Refactored `generator.ts` with a composable condition DSL (`evaluateCondition()`) supporting:
   - **String conditions**: `"always"`, `"gdpr"` (backward compat), `"data-collected"` (fixed — now checks `dataCollected.length > 0`)
   - **Object conditions**: `{ law: "gdpr" }`, `{ service: "stripe" }`, `{ dataType: "ads" }`, `{ jurisdiction: "DE" }`, `{ any: [...] }`, `{ all: [...] }`, `{ not: ... }`
   - All 14 original clauses + 6 new clauses: `analytics-details`, `advertising`, `email-marketing`, `payment-processing`, `cookie-consent`, `international-transfers-gdpr`
   - DPDP (India) law added with rights, legal basis text, grievance officer
   - Wizard: jurisdiction→law auto-suggestion, `dpdp` added to law constants
   - 26 new unit tests for condition DSL
   - Build: 9 pages, 0 errors. Tests: 64/64 passing.

3. **Embed disclaimers in generated output (P0.disclaimers)** — The "Not legal
   advice" banner must appear at the top of every generated policy (Markdown,
   HTML, plain text, and future PDF/DOCX), not just the website UI. Currently
   only on the site footer and wizard sidebar.

4. **Quarterly template update cadence (P0.updates)** — Formalise the review
   process for `src/data/clauses.json`. Monitor GDPR (EDPB), CCPA/CPRA, LGPD,
   PIPEDA changes. Document in a LEGAL_UPDATES.md with changelog.
   - Sources: EUR-Lex, EDPB guidelines, state privacy law trackers, IAPP

### P1 — AI Traffic Engine (Revenue Enablement)

Without discoverable traffic, there's no AdSense revenue and no premium conversions.

5. **Schema.org JSON-LD (P1.schema)** — Add `SoftwareApplication` structured
   data to the homepage and `FAQPage` to the FAQ section. Quick win for Google
   rich snippets.

6. **hreflang tags (P1.hreflang)** — Add `<link rel="alternate" hreflang="xx">`
   tags for all 17 languages. Without this, the i18n investment is invisible to
   search engines.

7. **Blog engine (P1.blog)** — 5-10 pillar blog posts targeting:
   - "GDPR privacy policy template" (long-tail, high intent)
   - "CCPA compliance checklist 2026"
   - "Privacy policy for AdSense websites"
   - "Privacy policy for SaaS applications"
   - "Free privacy policy generator India (DPDP Act)"
   - "Privacy policy for mobile apps"
   - "COPPA compliance for children's apps"
   - "Privacy policy for Shopify stores"
   Static pages under `/blog/` with Astro content collections.

8. **AdSense-ready ad slots (P1.adsense)** — Non-intrusive placements:
   - Blog sidebar (300×250)
   - Below generator on `/generate` (horizontal banner)
   - Below policy preview on download page
   Respect dark mode. Respect i18n.

### P2 — Monetisation

9. **Complete LemonSqueezy (P2.store)** — Create LS store, fill in
   `LEMONSQUEEZY_CHECKOUT_URL` in `.env.production`, verify end-to-end purchase
   flow. This is the revenue valve.

10. **PDF + DOCX export (P2.export)** — Client-side export via `jspdf` /
    `docx` (or `docx.js`). Paywalled behind premium tier. Free tier stays
    HTML / Markdown / plain text.

11. **White-label / remove branding (P2.whitelabel)** — Premium users get
    "Generated with PrivacyPolGen" removed from their policy output.

### P3 — Operations & Growth

12. **Analytics (P3.analytics)** — GA4 or Plausible for conversion tracking,
    traffic sources, funnels. Required to optimise AdSense placement and
    premium conversion rate.

13. **Cloudflare Pages deploy (P3.deploy)** — `wrangler.toml`, GitHub Actions
    CI/CD, custom domain, Cloudflare Workers for edge redirects.

14. **Sitemap optimisation (P3.sitemap)** — Dynamic sitemap entries for all
    17 language variants of each page.

---

## How This Differs From v1.0 Thinking

| v1.0 | v2.0 |
|------|------|
| "Privacy policy generator" generic tool | **Global SaaS platform** with jurisdiction-aware generation |
| i18n was "nice to have" | i18n is **SEO fuel** for 17 language markets |
| Legal templates were static | Legal templates are **conditional, jurisdiction-aware** |
| Disclaimers on website only | Disclaimers **in every generated document** |
| AdSense mentioned but not wired | AdSense as **primary traffic monetisation** |
| Features in random order | **Risk-ranked priority tiers** (legal > traffic > revenue > ops) |

---

## Alignment With Gemini Compliance Framework

```
┌─────────────────────────────────────────────────────┐
│  LEGAL SAFETY  (P0)                                 │
│  ├─ Strong ToS + disclaimers          ✅ done      │
│  ├─ Liability cap / indemnification    ✅ done      │
│  ├─ Real jurisdiction                  ❌ fix now   │
│  └─ Disclaimers in generated output    ❌ P0        │
├─────────────────────────────────────────────────────┤
│  ARCHITECTURAL SAFETY  (P0)                         │
│  ├─ Conditional clause injection      ❌ P0.engine  │
│  ├─ Quarterly update cadence          ❌ P0.updates │
│  └─ Client-side architecture          ✅ done       │
├─────────────────────────────────────────────────────┤
│  DATA SAFETY  (✅ fully done)                       │
│  └─ No backend, no storage, no server ✅ done       │
└─────────────────────────────────────────────────────┘
```

### Pricing

- **Free tier**: Generate, preview, share, download (HTML, Markdown, plain
  text). Watermark "Generated with PrivacyPolGen" in footer.
- **Premium (one-time $19)**: Remove branding, DOCX/PDF export, edit-key
  for re-editing. LemonSqueezy checkout wired in `Pricing.astro` — reads
  `LEMONSQUEEZY_CHECKOUT_URL` from env at build time. Shows "Coming soon"
  when URL is empty (no LS store created yet).

### Legal Template Update Strategy

- **Review cadence**: Legal templates in `src/data/clauses.json` should be
  reviewed every 3 months (quarterly) for regulatory changes.
- **Sources to monitor**:
  - EU: GDPR updates via EUR-Lex / EDPB guidelines
  - US: New state privacy laws (e.g., CPRA enforcement, new state laws)
  - Other: LGPD (Brazil), PIPEDA (Canada), PDPA-SG (Singapore), DPDP (India)
- **Process**: Update `clauses.json` with new/modified clauses, update
  `src/data/laws.json` if new laws are added, and rebuild the site.
- **Disclaimer**: The "Not legal advice" footer and Terms of Service
  Section 3 should be kept in sync with any template changes.
- **Changelog**: Maintain `LEGAL_UPDATES.md` tracking each quarterly review
  with date, changes made, and regulatory sources consulted.
