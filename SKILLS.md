# SKILLS.md — Essential AI Skills for Micro-SaaS Development
## Skills compatible with Claude Code, Cursor, Codex CLI, Gemini CLI, Kimi CLI

---

## 📌 PURPOSE

This document catalogs the essential skills (SKILL.md files) needed for frontend, backend, API, and server-side development across all 8 tools. Skills are organized by role and include installation commands, trigger conditions, and usage patterns.

**Last Updated:** 2026-06-02
**Total Skills Listed:** 25+

---

## 🎨 FRONTEND DEVELOPMENT SKILLS

### 1. Frontend Design (Official Anthropic)
**Install:** `npx skills add anthropics/claude-code --skill frontend-design`
**Installs:** 277,000+ (March 2026)
**Trigger:** When building any UI component, landing page, or design system
**What it does:**
- Bans overused fonts (Inter, Roboto, Arial, Space Grotesk)
- Enforces deliberate aesthetic choices (brutalist, editorial, retro-futuristic)
- Handles typography pairings, color systems, motion, spatial composition
- Prevents "AI slop" — generic purple-gradient interfaces

**Example:**
```
/frontend-design "Build a landing page for a recipe tool. Warm, editorial aesthetic with serif headings."
```

**Why essential:** Every tool needs a landing page. Without this skill, all 8 tools will look identical and forgettable.

---

### 2. Vercel React Best Practices
**Install:** `npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices`
**Trigger:** When working with React components, especially in Astro islands
**What it does:**
- Eliminates request waterfalls using Suspense boundaries
- Avoids barrel imports that pull entire libraries
- Uses `next/dynamic` patterns for heavy components
- Applies CSS `content-visibility` for long lists
- Subscribes to derived state booleans, not raw values

**Example:**
```
"Review this calculator component for performance issues"
"Refactor this page to eliminate data fetching waterfalls"
```

**Why essential:** Calculator tools need to be fast. This skill prevents common React performance pitfalls.

---

### 3. Composition Patterns (Vercel Labs)
**Install:** `npx skills add https://github.com/vercel-labs/agent-skills --skill composition-patterns`
**Trigger:** When building reusable UI components, design systems
**What it does:**
- Compound component patterns (`<Select>`, `<Select.Trigger>`, `<Select.Content>`)
- State decoupling via provider interfaces
- Explicit variants: `<Alert.Destructive>` instead of `<Alert isDestructive>`
- React 19 `use()` hook instead of `useContext()`

**Why essential:** shadcn/ui uses compound components. Understanding these patterns is critical for customizing UI.

---

### 4. Webapp Testing (Official Anthropic)
**Install:** `npx skills add https://github.com/anthropics/skills --skill webapp-testing`
**Trigger:** When testing user flows, authentication, JavaScript-rendered content
**What it does:**
- Browser control via Playwright for live app testing
- Tests login flows, form validation, checkout processes
- Catches UI bugs that static analysis misses

**Example:**
```
"Test the login flow at http://localhost:3000. Try valid and invalid credentials."
"Run through the checkout flow and check that form validation catches missing fields."
```

**Why essential:** Every tool needs E2E testing. This skill automates browser testing without writing test scripts.

---

## ⚙️ BACKEND & API DEVELOPMENT SKILLS

### 5. API Design Principles (Antigravity)
**Install:** `npx antigravity-awesome-skills --claude` (includes this skill)
**Trigger:** When designing REST endpoints, GraphQL schemas, or serverless functions
**What it does:**
- RESTful resource naming conventions
- HTTP method semantics (GET, POST, PUT, DELETE, PATCH)
- Status code best practices
- Versioning strategies
- Rate limiting patterns
- Pagination standards (cursor vs offset)

**Why essential:** Cloudflare Workers need well-designed APIs. This skill prevents common API anti-patterns.

---

### 6. Cloudflare Workers Skill
**Install:** Custom skill (see MCP.md for Cloudflare MCP server)
**Trigger:** When writing serverless functions, D1 queries, KV operations
**What it does:**
- Wrangler CLI commands and configuration
- Worker request/response patterns
- D1 database schema design
- KV key-value operations
- Environment variable management
- Local development with `wrangler dev`

**Why essential:** 3 tools (Privacy Policy Generator, Bill Splitter, Freelance Quote) need serverless backends.

---

### 7. Database Schema Design (PlanetScale)
**Install:** `npx skills add planetscale/skills`
**Trigger:** When designing D1 schemas for multi-user features
**What it does:**
- Schema branching and query optimization
- Index design for common queries
- Migration patterns
- Connection pooling

**Why essential:** SplitHouseholdBills.com needs multi-user data persistence. Proper schema design prevents scaling issues.

---

## 🧠 REASONING & THINKING SKILLS

### 8. Brainstorming (Obra Superpowers)
**Install:** `npx skills add obra/superpowers`
**Trigger:** At the start of any new feature or tool
**What it does:**
- Refines ideas through structured questions
- Saves design doc with architecture decisions
- Identifies edge cases and risks before coding

**Example:**
```
/brainstorm "I want to add real-time collaboration to the bill splitter"
```

**Why essential:** Prevents rework. 10 minutes of brainstorming saves hours of refactoring.

---

### 9. Architecture (Antigravity)
**Install:** `npx antigravity-awesome-skills --claude`
**Trigger:** When planning system structure, component hierarchy, data flow
**What it does:**
- Component structure recommendations
- State management decisions (local vs global)
- Data flow patterns (props, context, stores)
- Separation of concerns

**Why essential:** 8 tools share patterns. Consistent architecture makes maintenance easier.

---

### 10. Debugging Strategies (Antigravity)
**Install:** `npx antigravity-awesome-skills --claude`
**Trigger:** When tests fail, builds break, or runtime errors occur
**What it does:**
- Systematic troubleshooting playbooks
- Binary search debugging (comment half the code)
- Console.log placement strategy
- Network request inspection
- State inspection techniques

**Why essential:** Auto-debug loop in CLAUDE.md relies on these strategies.

---

## 📝 PROMPT ENGINEERING SKILLS

### 11. Prompt Engineering Best Practices
**Install:** Custom skill (documented below)
**Trigger:** When writing prompts for Claude, Copilot, or other AI tools
**What it does:**
- Structured prompt templates
- Context window optimization
- Chain-of-thought prompting
- Few-shot examples
- Output format specification

**Prompt Template:**
```markdown
## Role
You are a [senior frontend developer / backend engineer / DevOps specialist]

## Context
[Project name, current state, relevant files]

## Task
[Specific, actionable instruction]

## Constraints
- [Time limit]
- [Performance budget]
- [Browser support]
- [Accessibility requirements]

## Output Format
[Code block, markdown, JSON, etc.]

## Examples
[2-3 examples of desired output]
```

**Why essential:** Better prompts = better code. This skill pays dividends across all 8 tools.

---

### 12. Code Reviewer (Official Anthropic)
**Install:** `npx skills add anthropics/claude-code --skill code-reviewer`
**Trigger:** Before every commit, when reviewing PRs
**What it does:**
- Automated quality checks
- Simplification suggestions
- Security vulnerability detection
- Performance bottleneck identification
- Style consistency enforcement

**Example:**
```
"Review this PR for the recipe scaling calculator. Check for security issues and performance bottlenecks."
```

**Why essential:** Catches bugs before they reach production. Acts as a second pair of eyes.

---

## 🔒 SECURITY SKILLS

### 13. Security Auditor (Trail of Bits)
**Install:** `npx skills add trailofbits/skills`
**Trigger:** When handling user data, payments, authentication
**What it does:**
- Static analysis with CodeQL and Semgrep
- Variant analysis for vulnerability patterns
- Structured code auditing methodology
- OWASP Top 10 coverage

**Example:**
```
"Run a security audit on the authentication module"
"Find variants of this XSS pattern across the codebase"
```

**Why essential:** Privacy Policy Generator and Freelance Quote handle sensitive data. Security is non-negotiable.

---

### 14. Snyk Fix (Official)
**Install:** `git clone https://github.com/snyk/studio-recipes.git`
**Trigger:** When dependency vulnerabilities are found
**What it does:**
- Auto-detects scan type (SAST or SCA)
- Fixes highest priority issues first
- Validates fixes with re-scan
- Creates PRs for fixes

**Why essential:** npm dependencies have vulnerabilities. This skill automates remediation.

---

## 📊 ANALYTICS & MONITORING SKILLS

### 15. Site QA and Improvement Loop
**Install:** Project-local in `.claude/skills/qa`
**Trigger:** At the start of any session on a live site
**What it does:**
- Runs structured audit of site/app
- Writes findings into QA.md
- Sibling skill picks items and fixes them
- Catches design drift, dead links, unused code

**Why essential:** Prevents technical debt accumulation across 8 tools.

---

## 🎬 CONTENT & MARKETING SKILLS

### 16. Content Production (Developers Digest)
**Install:** `npx skills add https://github.com/coreyhaines31/marketingskills`
**Trigger:** When writing blog posts, social content, landing page copy
**What it does:**
- Research and scripting
- Blog drafting with SEO optimization
- Distribution strategy
- YouTube production assets

**Why essential:** SEO content drives traffic. Each tool needs 2-3 blog posts/week.

---

## 🛠️ DEVOPS & DEPLOYMENT SKILLS

### 17. Deploy and Infra Debug
**Install:** Custom skill for Cloudflare
**Trigger:** When deployments fail, build errors occur
**What it does:**
- Cloudflare-specific failure modes
- Build cache pruning
- Queue inspection
- Wrangler debugging

**Why essential:** Cloudflare Pages deployments can fail. This skill knows the recovery commands.

---

### 18. Git Workflow
**Install:** `npx skills add https://github.com/anthropics/skills --skill git`
**Trigger:** When branching, merging, rebasing, or resolving conflicts
**What it does:**
- Feature branch workflow
- Commit message conventions
- Rebase vs merge decisions
- Conflict resolution patterns

**Why essential:** Consistent git workflow across 8 repos prevents merge disasters.

---

## 📋 DOCUMENTATION SKILLS

### 19. Doc Coauthoring (Antigravity)
**Install:** `npx antigravity-awesome-skills --claude`
**Trigger:** When writing README, API docs, or user guides
**What it does:**
- Structured technical documentation
- Code example formatting
- API reference generation
- Changelog maintenance

**Why essential:** Each tool needs documentation. Consistent docs reduce support burden.

---

## 🎯 TOOL-SPECIFIC SKILLS

### 20. PDF Generation Skill
**Install:** `npx skills add https://github.com/anthropics/skills --skill pdf`
**Trigger:** When generating PDFs (Freelance Quote, Recipe Substitution)
**What it does:**
- jsPDF and html2pdf.js best practices
- Professional template design
- Multi-page layouts
- Print-friendly CSS

**Tools:** FreelanceQuoteCalculator.com, RecipeSubstitutionGuide.com

---

### 21. Image Processing Skill
**Install:** Custom skill for Canvas API
**Trigger:** When extracting colors, processing images (Color Palette tool)
**What it does:**
- Canvas API pixel manipulation
- Color space conversions (RGB, HSL, HEX)
- K-means clustering for dominant colors
- Image format handling (PNG, JPG, WebP)

**Tools:** ColorPaletteFromImage.com

---

### 22. Recipe & Cooking Domain Skill
**Install:** Custom skill (domain-specific knowledge)
**Trigger:** When building recipe scaling, substitution tools
**What it does:**
- Ingredient density database
- Unit conversion standards (US vs metric)
- Baking chemistry basics
- Dietary restriction mappings

**Tools:** RecipeScalingCalculator.com, RecipeSubstitutionGuide.com

---

### 23. Legal Document Generation Skill
**Install:** Custom skill
**Trigger:** When generating privacy policies, terms of service
**What it does:**
- GDPR, CCPA, PIPEDA, LGPD requirements
- Jurisdiction-specific clauses
- Template variable substitution
- Compliance checklist validation

**Tools:** PrivacyPolicyGeneratorFree.com

---

## 🧩 META SKILLS

### 24. Skill Builder (Official Anthropic)
**Install:** `npx skills add https://github.com/anthropics/skills --skill skill-creator`
**Trigger:** When you find yourself repeating the same prompt 3+ times
**What it does:**
- Interactive Q&A to generate new skills
- Proper SKILL.md structure
- Trigger condition definition
- Edge case handling

**Why essential:** The most useful skills are custom-built for your workflow.

---

### 25. Multi-Agent Dispatch (Swarm)
**Install:** `npx skills add obra/superpowers` (includes swarm)
**Trigger:** When tasks have 2+ independent sub-tasks
**What it does:**
- Decomposes goals into parallel sub-tasks
- Fans out to multiple agents
- Cuts wall-clock time by 3-5x

**Example:**
```
"Research competitor pricing, write blog post, and update landing page copy"
→ 3 parallel agents execute simultaneously
```

**Why essential:** Speed. Research + content + code can happen in parallel.

---

## 📦 SKILL INSTALLATION SUMMARY

### One-Command Install (All Essential Skills)
```bash
# Official Anthropic skills
npx skills add anthropics/claude-code --skill frontend-design
npx skills add anthropics/claude-code --skill code-reviewer
npx skills add anthropics/claude-code --skill webapp-testing
npx skills add anthropics/claude-code --skill pdf
npx skills add anthropics/claude-code --skill skill-creator

# Vercel Labs skills
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
npx skills add https://github.com/vercel-labs/agent-skills --skill composition-patterns

# Antigravity Awesome Skills (1,234+ skills)
npx antigravity-awesome-skills --claude

# Obra Superpowers
npx skills add obra/superpowers

# Trail of Bits Security
npx skills add trailofbits/skills

# Snyk Fix
npx skills add snyk/studio-recipes
```

### Verify Installation
```bash
npx skills list
```

---

## 🎯 SKILL PRIORITY MATRIX

| Priority | Skill | Tools Affected | Impact |
|----------|-------|---------------|--------|
| 🔴 Critical | Frontend Design | All 8 | Visual quality |
| 🔴 Critical | Code Reviewer | All 8 | Bug prevention |
| 🟠 High | Brainstorming | All 8 | Architecture quality |
| 🟠 High | Security Auditor | Privacy, Quote, Bills | Compliance |
| 🟡 Medium | Webapp Testing | All 8 | Quality assurance |
| 🟡 Medium | API Design | 3 with Workers | Backend quality |
| 🟢 Low | Content Production | All 8 | Marketing velocity |
| 🟢 Low | PDF Generation | 2 tools | Feature completeness |

---

*Install critical and high-priority skills first. Add others as needed.*
