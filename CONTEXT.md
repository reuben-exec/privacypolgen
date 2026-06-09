# PrivacyPolGen — Context for AI Assistants

> Project-specific context for the `privacypolgen` codebase (Tool #1 of 8
> in the portfolio described in `BUILD_PLAN.md`). Read this file first
> whenever you start a new session on this project.

---

## Project Overview

- **Name**: PrivacyPolGen
- **Domain**: privacypolgen.com
- **Purpose**: Free, no-signup, client-side privacy policy generator that
  produces jurisdiction-aware policies covering GDPR, CCPA/CPRA, CalOPPA,
  COPPA, PIPEDA, LGPD, and DPDP (India).
- **Target Audience**: Indie hackers, small businesses, SaaS founders, and
  mobile-app developers who need a compliant privacy policy in under a minute
  without legal fees or sending data to a server.
- **Global audience strategy**: 17 language translations (ar, bn, de, en, es,
  fr, hi, ja, ka, ko, nl, pt, ru, ta, tr, vi, zh). Each language targets its
  local search market via hreflang tags (planned).
- **Primary Keywords**:
  1. "privacy policy generator" (33,100/mo)
  2. "free privacy policy generator" (14,800/mo)
  3. "privacy policy for website" (6,600/mo)
- **Monetization**: Dual-track — (1) AdSense with non-intrusive placements
  (blog sidebar, below generator, below policy preview), (2) Freemium premium
  — $19 one-time for DOCX + PDF export + white-label + edit-key.
  Payments via LemonSqueezy — `.env` plumbing wired, awaiting store creation.
- **Build Status**: v1.0 MVP — all core pages built, 64/64 tests passing,
  build passes. Not yet deployed to production.

## Tech Stack (actual, from `package.json`)

1. **Framework**: Astro.js **v6.4.4** (static output, `output: 'static'`)
2. **Styling**: Tailwind CSS **v4.3.0** (CSS-first config via
   `@tailwindcss/vite`, design tokens in `src/styles/global.css` `@theme` block)
3. **Components**: React **v19.2.7** islands (`client:load` / `client:only`)
4. **UI Library**: **None** — bespoke component classes (`.btn`, `.card`,
   `.input`, etc.) in `global.css`. No shadcn/ui despite what `BUILD_PLAN.md`
   still says.
5. **Hosting**: Cloudflare Pages (planned, not yet configured — no
   `wrangler.toml` exists yet)
6. **Payments**: LemonSqueezy (`.env` wired in `Pricing.astro` — reads
   `LEMONSQUEEZY_CHECKOUT_URL` at build time. Shows "Coming soon" when empty,
   switches to live checkout link when populated. See `.env.example`.)
7. **Analytics**: None yet (no GA4 / Plausible)
8. **Testing**: Vitest v3.2.6 — 64 tests in `tests/generator.test.ts`
   covering hash codec, policy generation, markdown converter, plain-text
   output, condition DSL (service/law/any/all/not/data-type/jurisdiction),
   DPDP integration, and data re-exports. Run via `npm test`.
9. **Tooling**: TypeScript strict (`@astrojs/check`), Node >= 22.12.0,
   `lucide-react` for icons, `clsx` + `tailwind-merge` for class composition
10. **Translation**: 17 JSON files in `src/i18n/*.json`, client-side i18n
    engine in `src/lib/i18n.ts` with `import.meta.glob`. Translations done
    via `deep-translator` (Google Translate free API, no key).

## Core Features

- **5-step wizard** (`/generate`) — Business info → Data collected →
  Third-party services → Applicable laws → Contact. Live preview side panel.
- **Client-side policy generation** (`src/lib/generator.ts`) — Pure functions,
  no server, no DB. Combines user answers with structured data from
  `src/data/*.json` to produce Markdown + HTML + plain-text outputs.
- **Shareable policies** (`/p?h=…`) — The full policy input is encoded into
  a URL-safe hash using LZW compression + base64url. No backend storage
  needed. The reader decodes the hash on the client and re-renders.
- **Examples gallery** (`/examples`) — 4 pre-baked sample policies
  (personal blog, SaaS, e-commerce, mobile app) generated at build time.
- **Dark mode default** — FOUC prevention via inline `<head>` script that
  reads `localStorage` → OS preference → dark fallback. ThemeToggle.astro
  persists user choice.
- **Responsive + accessible** — Mobile-first, semantic HTML, dark/light
  tokens, proper meta/OG tags via `SeoHead.astro`.
- **i18n in 17 languages** — Client-side locale switcher, all page content
  translated via JSON translation files. Locale persisted in localStorage.
- **Jurisdiction-aware generation** (planned for v2.0) — Conditional clause
  injection based on wizard answers: GDPR if EU traffic, CCPA if California,
  LGPD if Brazil, DPDP if India, COPPA if under-13 targeting.

## Architecture Notes

- **No backend**: Static site. Everything runs in the browser. This is a
  deliberate design choice for cost (Cloudflare Pages free tier) and trust
  (we never see user answers).
- **Data layer is JSON**: `businessTypes.json`, `clauses.json`, `laws.json`,
  `services.json`, `faq.json` are all bundled at build time. `generator.ts`
  imports them as static data.
- **LZW hash codec**: 4096-entry dictionary, 9→12 bit codes, base64url
  output. Compact enough that policy inputs fit in a short URL.
- **No data sent to server**: The wizard, generator, and policy reader all
  run client-side. The "shareable link" is the only persistence mechanism.
- **Compliance framework** (Gemini-recommended):
  - **Legal safety** (P0): Bulletproof ToS with disclaimers, liability cap,
    indemnification — mostly done. Remaining: fix `[Your Jurisdiction]`
    placeholder, embed disclaimers in generated output.
  - **Architectural safety** (P0): Conditional clause injection by
    jurisdiction/data-practices — not yet done. Quarterly template review
    cadence — format documented, not yet operationalised.
  - **Data safety** (✅ done): Client-side only, no backend storage.

## SEO Strategy

- **Primary keyword**: "privacy policy generator"
- **Schema markup**: SoftwareApplication + FAQPage (planned — not yet
  implemented in source). See roadmap below.
- **hreflang**: Planned for all 17 language variants. Without this, i18n
  investment is invisible to search engines.
- **Blog**: 5-10 pillar posts planned targeting long-tail keywords
  ("GDPR privacy policy template", "CCPA compliance checklist 2026",
  "Privacy policy for AdSense", etc.) — see BUILD_PLAN.md for full list.
- **AdSense**: Blog sidebar, below generator, below policy preview —
  non-intrusive placements, dark-mode compatible.
- **On-page**: Title, description, OG image (`public/og.png`), canonical URL,
  sitemap (`@astrojs/sitemap`), robots.txt.

## File Map (where to look first)

| What | Where |
|------|-------|
| Page entry points | `src/pages/*.astro` |
| Wizard (5-step form) | `src/components/Wizard.tsx` |
| Policy generator (pure logic) | `src/lib/generator.ts` |
| Static reference data | `src/data/*.json` |
| i18n translation files | `src/i18n/*.json` (17 files) |
| Client-side i18n engine | `src/lib/i18n.ts` |
| Translation scripts | `scripts/translate_i18n.py`, `scripts/fix_list_items.py` |
| Design tokens / global styles | `src/styles/global.css` |
| Layout shell + SEO + theme | `src/layouts/Layout.astro`, `src/components/SeoHead.astro` |
| Landing page sections | `src/components/sections/*.astro` |
| Tests | `tests/generator.test.ts` |
| Test config | `vitest.config.ts` |
| Env vars | `.env` (local), `.env.example` (template), `.env.production` (deploy) |
| Public assets (favicon, og) | `public/` |
| Astro config | `astro.config.mjs` |
| TypeScript config | `tsconfig.json` |

## Roadmap (Priority Order Descending)

### P0 — Legal Shield + Intelligent Generator (Launch Blockers)

- [ ] **P0.legal** — Fix `[Your Jurisdiction]` placeholder in terms.astro §10
- [ ] **P0.engine** — Refactor generator.ts for conditional clause injection by
  jurisdiction/data-practices (GDPR, CCPA, LGPD, DPDP, AdSense, analytics, etc.)
- [ ] **P0.disclaimers** — Embed "Not legal advice" banner in generated output
  (Markdown, HTML, plain text, future PDF/DOCX)
- [ ] **P0.updates** — Formalise quarterly template review cadence with
  LEGAL_UPDATES.md changelog

### P1 — AI Traffic Engine (Revenue Enablement)

- [ ] **P1.schema** — Add SoftwareApplication + FAQPage JSON-LD structured data
- [ ] **P1.hreflang** — Add hreflang tags for all 17 languages
- [ ] **P1.blog** — 5-10 pillar blog posts targeting long-tail keywords
- [ ] **P1.adsense** — AdSense-ready ad slots (blog sidebar, below generator)

### P2 — Monetisation

- [ ] **P2.store** — Create LemonSqueezy store, wire real checkout URL
- [ ] **P2.export** — PDF + DOCX client-side export (premium tier)
- [ ] **P2.whitelabel** — Remove branding for premium users

### P3 — Operations & Growth

- [ ] **P3.analytics** — GA4 or Plausible
- [ ] **P3.deploy** — Cloudflare Pages with CI/CD
- [ ] **P3.sitemap** — Dynamic entries for all 17 language variants

## Known Issues / TODOs

- `BUILD_PLAN.md` still says Astro v5 and mentions shadcn/ui — docs drift
- No lint/format scripts (`eslint`, `prettier`) in `package.json`
- Schema.org JSON-LD not implemented
- `[Your Jurisdiction]` placeholder in terms.astro §10 exposes liability
- `examples.astro` hashes are computed at build time but the `/p` reader is
  client-only, so SSR vs client encoding must round-trip correctly (smoke
  test needed)
- 6 npm vulnerabilities (5 moderate, 1 critical) — pre-existing in
  `node_modules`
- No LEGAL_UPDATES.md exists yet for template changelog
- Translation script (`scripts/translate_i18n.py`) has buggy
  `set_nested_value` that creates bogus array keys — workaround exists
  (`scripts/fix_list_items.py`)
- All 128 bogus keys have been removed, all 128 list items re-translated
  across all 16 non-English files

## Build Log

- [2026-06-06 12:30] Initial project scaffolded: Astro v6 + Tailwind v4 +
  React 19 islands. Landing, wizard, generator, examples, pricing, 404.
- [2026-06-06 12:50] Design system in `global.css` — dark default,
  theme tokens, button/card/input component classes.
- [2026-06-06 13:00] LZW+base64url hash codec implemented. URL-shareable
  policies working (`/p?h=…` round-trips).
- [2026-06-06 13:14] Production build verified — 6 pages, 9.07s, zero errors.
- [2026-06-06 13:14] Dev server running at `http://127.0.0.1:4321/`.
- [2026-06-06 13:15] Split portfolio CONTEXT.md into `BUILD_PLAN.md`
  (master plan) and this file (per-tool context). Docs cleanup pass.
- [2026-06-06 13:51] Vitest 3.2.6 installed. 32 tests in
  `tests/generator.test.ts` — all passing.
- [2026-06-06 13:58] LemonSqueezy `.env` plumbing wired in `Pricing.astro`.
- [2026-06-08 22:00] i18n completed: 17 JSON files, all 4 pages translated
  (home, terms, privacy, contact), 128 bogus keys removed, 128 list items
  re-translated. Privacy page list attributes fixed.
- [2026-06-08 23:00] Gemini compliance framework integrated. Roadmap
  reprioritised: P0 Legal Shield + Conditional Engine > P1 Traffic Engine >
  P2 Monetisation > P3 Operations. Compliance audit summary:
  - Legal safety: ToS strong, disclaimers present, but `[Your Jurisdiction]`
    placeholder remains and disclaimers not embedded in generated output.
  - Architectural safety: Conditional clause injection not yet implemented;
    quarterly update cadence documented but not operationalised.
  - Data safety: ✅ Fully done — client-side only, no backend storage.
