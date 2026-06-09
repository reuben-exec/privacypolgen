# GitHub_repos.md — Verified Repositories & OSS Tools
## For: 8 Micro-SaaS Tools (Astro.js + Cloudflare + LemonSqueezy)

---

## 📌 PURPOSE

This document catalogs every verified, actively maintained GitHub repository and open-source tool used across all 8 projects. Each entry includes stars, license, last update, compatibility notes, and which tools use it.

**Last Updated:** 2026-06-02
**Total Repos Listed:** 40+

---

## 🌐 FRAMEWORKS & CORE TOOLS (All 8 Tools)

### 1. Astro
**Repo:** `withastro/astro`
**Stars:** 48,000+
**License:** MIT
**Last Update:** Active (weekly releases)
**URL:** https://github.com/withastro/astro
**Used By:** All 8 tools
**Purpose:** Static site generator with islands architecture
**Why:** Zero JS by default, React/Vue/Svelte islands, built-in sitemap/RSS/image optimization
**Compatibility:** Cloudflare Pages (official adapter)
**Install:** `npm create astro@latest`

---

### 2. Tailwind CSS
**Repo:** `tailwindlabs/tailwindcss`
**Stars:** 85,000+
**License:** MIT
**Last Update:** Active (v4 released 2025)
**URL:** https://github.com/tailwindlabs/tailwindcss
**Used By:** All 8 tools
**Purpose:** Utility-first CSS framework
**Why:** Mobile-first responsive design, dark mode, custom design tokens
**Compatibility:** Works with Astro via `@astrojs/tailwind`
**Install:** `npx astro add tailwind`

---

### 3. React
**Repo:** `facebook/react`
**Stars:** 231,000+
**License:** MIT
**Last Update:** Active (React 19 stable)
**URL:** https://github.com/facebook/react
**Used By:** All 8 tools (islands)
**Purpose:** UI component library
**Why:** Islands architecture in Astro, familiar ecosystem
**Compatibility:** Astro `client:*` directives
**Install:** `npx astro add react`

---

### 4. TypeScript
**Repo:** `microsoft/TypeScript`
**Stars:** 103,000+
**License:** Apache-2.0
**Last Update:** Active (v5.8+)
**URL:** https://github.com/microsoft/TypeScript
**Used By:** All 8 tools
**Purpose:** Type-safe JavaScript
**Why:** Strict mode prevents runtime errors, excellent IDE support
**Compatibility:** Native Astro support
**Install:** Included with Astro scaffold

---

### 5. shadcn/ui
**Repo:** `shadcn-ui/ui`
**Stars:** 85,000+
**License:** MIT
**Last Update:** Active (weekly updates)
**URL:** https://github.com/shadcn-ui/ui
**Used By:** All 8 tools
**Purpose:** Accessible UI component library
**Why:** Copy-paste components, customizable with Tailwind, accessible by default
**Compatibility:** Works with Astro React islands
**Install:** `npx shadcn@latest init`

---

## 🎨 DESIGN & UI TOOLS

### 6. Lucide React
**Repo:** `lucide-icons/lucide`
**Stars:** 15,000+
**License:** ISC
**Last Update:** Active
**URL:** https://github.com/lucide-icons/lucide
**Used By:** All 8 tools
**Purpose:** Icon library
**Why:** Tree-shakeable, consistent, lightweight
**Compatibility:** React, Astro, any framework
**Install:** `npm install lucide-react`

---

### 7. Google Stitch
**Repo:** N/A (Google internal tool)
**Stars:** N/A
**License:** Proprietary (free tier available)
**Last Update:** Active (2026)
**URL:** https://stitch.withgoogle.com
**Used By:** All 8 tools
**Purpose:** AI-powered UI/UX design generation
**Why:** Generate complete page designs from text prompts, export to code
**Compatibility:** Exports HTML/CSS/JS compatible with Astro
**Usage:** Prompt → Design → Export → Integrate into Astro

---

### 8. Framer Motion
**Repo:** `motiondivision/motion`
**Stars:** 26,000+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/motiondivision/motion
**Used By:** All 8 tools (animations)
**Purpose:** Animation library for React
**Why:** Declarative animations, gesture support, layout animations
**Compatibility:** Works in Astro React islands
**Install:** `npm install framer-motion`

---

## 🧪 TESTING TOOLS

### 9. Vitest
**Repo:** `vitest-dev/vitest`
**Stars:** 14,000+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/vitest-dev/vitest
**Used By:** All 8 tools
**Purpose:** Unit testing framework
**Why:** Fast (Vite-native), TypeScript support, Jest-compatible API
**Compatibility:** Native Vite/Astro support
**Install:** `npm install -D vitest`

---

### 10. Playwright
**Repo:** `microsoft/playwright`
**Stars:** 70,000+
**License:** Apache-2.0
**Last Update:** Active (monthly releases)
**URL:** https://github.com/microsoft/playwright
**Used By:** All 8 tools (E2E testing)
**Purpose:** End-to-end testing
**Why:** Multi-browser (Chromium, Firefox, WebKit), auto-wait, trace viewer
**Compatibility:** Works with any web app
**Install:** `npm install -D @playwright/test`

---

### 11. Testing Library
**Repo:** `testing-library/react-testing-library`
**Stars:** 18,000+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/testing-library/react-testing-library
**Used By:** All 8 tools (component testing)
**Purpose:** React component testing utilities
**Why:** User-centric queries, accessibility-first, no implementation details
**Compatibility:** React 18/19
**Install:** `npm install -D @testing-library/react`

---

## 🛠️ DEVELOPER TOOLS

### 12. ESLint
**Repo:** `eslint/eslint`
**Stars:** 25,000+
**License:** MIT
**Last Update:** Active (v9 flat config)
**URL:** https://github.com/eslint/eslint
**Used By:** All 8 tools
**Purpose:** JavaScript/TypeScript linting
**Why:** Catches bugs, enforces style, Astro/React specific rules
**Compatibility:** `eslint-plugin-astro`, `eslint-plugin-react`
**Install:** `npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`

---

### 13. Prettier
**Repo:** `prettier/prettier`
**Stars:** 50,000+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/prettier/prettier
**Used By:** All 8 tools
**Purpose:** Code formatting
**Why:** Consistent formatting, Astro plugin available
**Compatibility:** `prettier-plugin-astro`
**Install:** `npm install -D prettier prettier-plugin-astro`

---

### 14. Wrangler
**Repo:** `cloudflare/workers-sdk`
**Stars:** 3,000+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/cloudflare/workers-sdk
**Used By:** 3 tools (Privacy Policy, Bill Splitter, Freelance Quote)
**Purpose:** Cloudflare Workers CLI
**Why:** Local dev, deployment, secrets management, D1/KV operations
**Compatibility:** Official Cloudflare tool
**Install:** `npm install -D wrangler`

---

## 💳 PAYMENT & MONETIZATION

### 15. LemonSqueezy.js
**Repo:** `lemonsqueezy/lemonsqueezy.js`
**Stars:** 800+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/lemonsqueezy/lemonsqueezy.js
**Used By:** All 8 tools (freemium)
**Purpose:** Payment processing SDK
**Why:** No monthly fees, Merchant of Record, global tax compliance, Indian payouts
**Compatibility:** Browser + Node.js + Cloudflare Workers
**Install:** `npm install @lemonsqueezy/lemonsqueezy.js`

---

## 📊 ANALYTICS

### 16. Plausible Analytics (Self-Hosted)
**Repo:** `plausible/analytics`
**Stars:** 21,000+
**License:** AGPL-3.0
**Last Update:** Active
**URL:** https://github.com/plausible/analytics
**Used By:** All 8 tools
**Purpose:** Privacy-friendly analytics
**Why:** Lightweight, GDPR-compliant, no cookie banner needed
**Compatibility:** Self-host on Cloudflare or use cloud version
**Install:** Self-host via Docker or use plausible.io

---

## 🗄️ DATABASE (Tool-Specific)

### 17. Cloudflare D1
**Repo:** `cloudflare/workers-sdk` (includes D1)
**Stars:** 3,000+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/cloudflare/workers-sdk
**Used By:** SplitHouseholdBills.com, PrivacyPolicyGeneratorFree.com
**Purpose:** Edge SQLite database
**Why:** 5GB free, 500K rows/day, global replication
**Compatibility:** Cloudflare Workers native
**Install:** Via Wrangler CLI

---

## 🔧 PDF GENERATION (Tool-Specific)

### 18. jsPDF
**Repo:** `parallax/jsPDF`
**Stars:** 30,000+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/parallax/jsPDF
**Used By:** FreelanceQuoteCalculator.com, RecipeSubstitutionGuide.com
**Purpose:** Client-side PDF generation
**Why:** No server needed, works in browser, customizable templates
**Compatibility:** Browser + Node.js
**Install:** `npm install jspdf`

---

### 19. html2pdf.js
**Repo:** `eKoopmans/html2pdf.js`
**Stars:** 4,000+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/eKoopmans/html2pdf.js
**Used By:** FreelanceQuoteCalculator.com
**Purpose:** Convert HTML to PDF
**Why:** Renders HTML/CSS directly, preserves styling
**Compatibility:** Browser only
**Install:** `npm install html2pdf.js`

---

## 🎨 COLOR PROCESSING (Tool-Specific)

### 20. Color Thief
**Repo:** `lokesh/color-thief`
**Stars:** 7,000+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/lokesh/color-thief
**Used By:** ColorPaletteFromImage.com
**Purpose:** Extract dominant colors from images
**Why:** Canvas API based, lightweight, accurate
**Compatibility:** Browser only
**Install:** `npm install colorthief`

---

### 21. chroma.js
**Repo:** `gka/chroma.js`
**Stars:** 10,000+
**License:** BSD-3-Clause
**Last Update:** Active
**URL:** https://github.com/gka/chroma.js
**Used By:** ColorPaletteFromImage.com
**Purpose:** Color manipulation library
**Why:** Color space conversions, harmonies, interpolation
**Compatibility:** Browser + Node.js
**Install:** `npm install chroma-js`

---

## 📋 FORM VALIDATION

### 22. Zod
**Repo:** `colinhacks/zod`
**Stars:** 36,000+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/colinhacks/zod
**Used By:** All 8 tools
**Purpose:** TypeScript schema validation
**Why:** Type-safe, composable, excellent error messages
**Compatibility:** Browser + Node.js + Workers
**Install:** `npm install zod`

---

## 🌐 DEPLOYMENT

### 23. Cloudflare Pages GitHub Action
**Repo:** `cloudflare/pages-action`
**Stars:** 1,500+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/cloudflare/pages-action
**Used By:** All 8 tools
**Purpose:** Auto-deploy to Cloudflare Pages from GitHub
**Why:** Zero-config deployment, branch previews, instant rollback
**Compatibility:** GitHub Actions
**Install:** Add to `.github/workflows/deploy.yml`

---

## 🧩 ASTRO INTEGRATIONS

### 24. @astrojs/sitemap
**Repo:** `withastro/astro` (monorepo)
**Stars:** 48,000+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/withastro/astro
**Used By:** All 8 tools
**Purpose:** Auto-generated XML sitemap
**Why:** SEO essential, zero config
**Compatibility:** Official Astro integration
**Install:** `npx astro add sitemap`

---

### 25. @astrojs/partytown
**Repo:** `withastro/astro` (monorepo)
**Stars:** 48,000+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/withastro/astro
**Used By:** All 8 tools
**Purpose:** Offload third-party scripts to web worker
**Why:** Improves Core Web Vitals, essential for GA4
**Compatibility:** Official Astro integration
**Install:** `npx astro add partytown`

---

## 🎯 TOOL-SPECIFIC REPOSITORIES

### Recipe Scaling Calculator
| Repo | Stars | Purpose |
|------|-------|---------|
| `convert-units` | 1,500+ | Unit conversion library |
| `fraction.js` | 800+ | Precise fraction math for recipes |

### Privacy Policy Generator
| Repo | Stars | Purpose |
|------|-------|---------|
| `handlebars` | 18,000+ | Template engine for policy generation |
| `markdown-it` | 18,000+ | Markdown rendering |

### Freelance Quote Calculator
| Repo | Stars | Purpose |
|------|-------|---------|
| `jspdf-autotable` | 3,000+ | PDF table generation |
| `date-fns` | 35,000+ | Date formatting for quotes |

### Split Household Bills
| Repo | Stars | Purpose |
|------|-------|---------|
| `dinero.js` | 4,000+ | Currency-safe calculations |
| `uuid` | 15,000+ | Unique group IDs |

---

## 📚 REFERENCE REPOSITORIES (Study & Inspiration)

### 26. cal.com
**Repo:** `calcom/cal.com`
**Stars:** 34,000+
**License:** AGPL-3.0
**URL:** https://github.com/calcom/cal.com
**Study For:** Full-stack TypeScript patterns, Prisma ORM, Next.js architecture, payment integration

### 27. stripe-samples
**Repo:** `stripe-samples`
**Stars:** 3,000+
**License:** MIT
**URL:** https://github.com/stripe-samples
**Study For:** Payment flow patterns, webhook handling, subscription logic

### 28. awesome-astro
**Repo:** `one-aalam/awesome-astro`
**Stars:** 2,000+
**License:** MIT
**URL:** https://github.com/one-aalam/awesome-astro
**Study For:** Astro ecosystem, integrations, examples

---

## 🔒 SECURITY TOOLS

### 29. Snyk CLI
**Repo:** `snyk/cli`
**Stars:** 5,000+
**License:** Apache-2.0
**URL:** https://github.com/snyk/cli
**Used By:** All 8 tools
**Purpose:** Vulnerability scanning
**Why:** Finds and fixes dependency vulnerabilities
**Compatibility:** CI/CD integration
**Install:** `npm install -D snyk`

---

## 📦 PACKAGE MANAGEMENT

### 30. pnpm
**Repo:** `pnpm/pnpm`
**Stars:** 31,000+
**License:** MIT
**Last Update:** Active
**URL:** https://github.com/pnpm/pnpm
**Used By:** All 8 tools
**Purpose:** Fast, disk-space efficient package manager
**Why:** 2x faster than npm, shared dependency store, strict node_modules
**Compatibility:** Drop-in npm replacement
**Install:** `npm install -g pnpm`

---

## 🎯 MCP-RELATED REPOSITORIES

### 31. Model Context Protocol (Official)
**Repo:** `modelcontextprotocol/specification`
**Stars:** 15,000+
**License:** MIT
**URL:** https://github.com/modelcontextprotocol/specification
**Purpose:** MCP protocol specification
**Study For:** Understanding MCP architecture, building custom servers

### 32. MCP Servers (Official)
**Repo:** `modelcontextprotocol/servers`
**Stars:** 20,000+
**License:** MIT
**URL:** https://github.com/modelcontextprotocol/servers
**Purpose:** Official MCP server implementations
**Study For:** Reference implementations, setup patterns

---

## 📊 REPOSITORY HEALTH CHECKLIST

Before adding any new dependency, verify:

| Check | How to Verify |
|-------|--------------|
| Stars | >1,000 for libraries, >100 for niche tools |
| Last Commit | Within 3 months |
| Open Issues | <50% of total issues (healthy ratio) |
| License | MIT, Apache-2.0, BSD (avoid GPL for SaaS) |
| Security | No critical CVEs (check snyk.io/advisor) |
| Bundle Size | <50KB for client-side libraries |
| Browser Support | Matches project requirements |

---

## 🚀 QUICK INSTALL (All Dependencies)

```bash
# Core (all tools)
npm install astro @astrojs/react @astrojs/tailwind @astrojs/sitemap @astrojs/partytown tailwindcss react react-dom typescript lucide-react zod framer-motion

# Dev tools (all tools)
npm install -D vitest @playwright/test @testing-library/react eslint prettier prettier-plugin-astro wrangler

# Payment (all tools)
npm install @lemonsqueezy/lemonsqueezy.js

# PDF (Freelance Quote, Recipe Substitution)
npm install jspdf html2pdf.js

# Color (Color Palette)
npm install colorthief chroma-js

# Testing utilities
npm install -D @vitest/coverage-v8 jsdom
```

---

*Verify all repos before use. Stars and activity change over time.*
