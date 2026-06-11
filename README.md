# PrivacyPolGen

**Generate GDPR & CCPA-compliant privacy policies — fast, free, and in 17 languages.**

PrivacyPolGen is a static web application that helps website owners, SaaS founders, e-commerce merchants, and app developers create legally compliant privacy policies tailored to their business. Built with Astro and Tailwind CSS, it's SEO-optimized and fully internationalized.

## Features

- **Smart Policy Generator** — Answer a few questions about your business and get a complete, customized privacy policy
- **17 Languages** — Fully translated UI and generated policies (English, Spanish, French, German, Portuguese, Dutch, Hindi, Bengali, Arabic, Japanese, Korean, Chinese, Vietnamese, Turkish, Tamil, Georgian, Russian)
- **Legal Coverage** — GDPR (EU/EEA, UK), CCPA/CPRA (California), CalOPPA, PIPEDA (Canada), LGPD (Brazil), and more
- **Real-time Preview** — See your policy as you build it
- **Copy & Download** — Export as plain text or download for your website
- **JSON-LD Schema** — Built-in FAQ structured data for rich search results
- **SEO Optimized** — Static-site generation with sitemap
- **Dark Mode** — Light and dark theme support

## Tech Stack

- [Astro](https://astro.build) 6 — Static site generation
- [Tailwind CSS](https://tailwindcss.com) 4 — Utility-first styling
- [TypeScript](https://www.typescriptlang.org) — Type safety
- [Vitest](https://vitest.dev) — Unit testing
- [Vite](https://vitejs.dev) — Build tooling

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

## Project Structure

```
src/
├── components/     # Reusable UI components (sections, widgets)
├── data/           # FAQ data (Q&A in English)
├── i18n/           # Translation files (17 locales)
├── layouts/        # Page layouts
├── lib/            # Utilities (i18n, generator logic)
├── pages/          # Astro routes
└── styles/         # Global CSS (Tailwind theme, utilities)
```

## Localization

Translations are stored as JSON files in `src/i18n/`. Each locale file mirrors the structure of `en.json`. To add a new locale, create a new file and run the translation scripts.

## License

Private — All rights reserved.
