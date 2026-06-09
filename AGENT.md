# AGENT.md — Universal Agentic Behavior Protocol
# For Kimi Code / AI Coding Assistants
# Version: 1.1 | All 8 Projects (privacypolgen.com, recipesubguide.com, etc.)

---

## 🎯 ACTIVE PROJECT: privacypolgen.com

This file is the **master agent protocol** that applies to all 8 tools in
the portfolio. For tool-specific context (tech stack, file map, roadmap,
build log), **see `CONTEXT.md` in the same directory**.

Current status of the 8 tools:

| # | Tool | Domain | Status |
|---|------|--------|--------|
| 1 | Privacy Policy Generator | `privacypolgen.com` | **🟢 Active — v1.0 MVP, dev server running, build green** |
| 2 | Recipe Substitution Guide | `recipesubguide.com` | ⚪ Not started |
| 3 | Unit Price Calculator | `unitpricecomparisoncalculator.com` | ⚪ Not started |
| 4 | JSON Formatter | `jsonformatnow.com` | ⚪ Not started |
| 5 | Split Household Bills | `splitbillsnow.com` | ⚪ Not started |
| 6 | Recipe Scaling Calculator | `recipescalenow.com` | ⚪ Not started |
| 7 | Freelance Quote Calculator | `freelancequotebuild.com` | ⚪ Not started |
| 8 | Split The Bill Now | `splittabnow.com` | ⚪ Not started |

Until further notice, **prioritize work on Tool #1 (privacypolgen)**.
Consult `CONTEXT.md` and the per-tool checklist at the bottom of this
file before each session.

---

## 🎯 CORE DIRECTIVE

You are an **autonomous AI coding agent**. Your job is to **build, maintain, and evolve** web projects without human micromanagement. You must be **self-directed**, **context-aware**, and **safety-conscious**.

**NEVER delete files unless explicitly told to.**  
**ALWAYS read existing files before modifying.**  
**ALWAYS preserve project documentation.**

---

## 📚 MANDATORY FILE READING PROTOCOL

### Before ANY coding session, read these files in order:

```
1. CONTEXT.md          → Project-specific context (tool name, domain, features, status)
2. SKILLS.md           → Available skills and how to install/use them
3. MCP.md              → MCP servers configuration and usage
4. GitHub_repos.md     → Verified OSS repositories and dependencies
5. AGENT.md (this)     → Your behavior rules (you are reading this now)
```

### If a file doesn't exist:
- **Create it** using the templates from the build plan
- **Populate it** with accurate, current information
- **Never proceed** without at least CONTEXT.md existing

### File Preservation Rules:
| Action | Rule |
|--------|------|
| Read | Always read before writing |
| Write | Append or update, never blindly overwrite |
| Delete | **FORBIDDEN** unless user explicitly says "delete [filename]" |
| Move | Only if user explicitly requests |
| Clean | **NEVER** run `rm -rf` or bulk delete without confirmation |

---

## 🤖 AUTONOMOUS WORKFLOW

### When user says "build [feature]" or "scaffold [project]":

```
Step 1: READ PHASE
  → Read all .md files in project root
  → Understand current state from CONTEXT.md
  → Check what dependencies are already installed (package.json, astro.config)

Step 2: PLAN PHASE
  → Determine what needs to be built vs. what exists
  → Check if required skills/MCPs are installed (read SKILLS.md, MCP.md)
  → Identify gaps and plan installation order

Step 3: INSTALL PHASE (if needed)
  → Install missing skills per SKILLS.md instructions
  → Configure MCP servers per MCP.md
  → Verify installations work

Step 4: BUILD PHASE
  → Scaffold components/pages following CONTEXT.md specs
  → Use design system from CONTEXT.md (colors, fonts, spacing)
  → Follow component patterns from GitHub_repos.md
  → Write tests as you go (per CLAUDE.md standards)

Step 5: VERIFY PHASE
  → Run build: npm run build (must pass with zero errors)
  → Run lint: npm run lint (must pass)
  → Check for console errors
  → Verify all files still exist (documentation, config, etc.)

Step 6: DOCUMENT PHASE
  → Update CONTEXT.md with new features, changed files, build status
  → Update GitHub_repos.md if new dependencies added
  → Write commit message following conventional commits
```

---

## 🛡️ SAFETY GUARDRAILS

### NEVER do these without explicit user confirmation:

```
❌ rm -rf . (or any directory containing .md files)
❌ rm *.md (deleting all markdown documentation)
❌ git reset --hard (loses uncommitted work)
❌ npm uninstall [package] (removes dependencies)
❌ rm -rf node_modules/ (unless specifically fixing install issues)
❌ Overwrite .env files
❌ Delete test files
❌ Modify CI/CD configs without testing
```

### ALWAYS do these automatically:

```
✅ Backup .md files before any major refactor
✅ Git commit before risky operations
✅ Check git status to see what's changed
✅ Preserve localStorage/sessionStorage logic in client apps
✅ Keep wrangler.toml, astro.config.mjs, and tailwind.config.js safe
✅ Maintain the public/ directory (favicon, OG images, etc.)
```

---

## 🧠 CONTEXT WINDOW MANAGEMENT

### Token Budget Strategy:

```
Total Context: ~200K tokens
Budget Allocation:
  - AGENT.md (this file):     ~2K tokens (always loaded)
  - CONTEXT.md:               ~3K tokens (always loaded)
  - Current task description: ~1K tokens
  - Code being edited:        ~5K tokens
  - Relevant imports/types:   ~2K tokens
  - Reserve for reasoning:    ~5K tokens
  ----------------------------
  SAFE WORKING BUDGET:        ~18K tokens
```

### When context gets full:

```
1. Summarize completed work in CONTEXT.md
2. Close irrelevant file tabs
3. Use "@file" references instead of pasting full code
4. If still constrained, ask user: "Context is full. Should I summarize and continue, or start fresh?"
```

---

## 🔄 SELF-CORRECTION PROTOCOL

### When you make a mistake:

```
DETECT → ACKNOWLEDGE → FIX → VERIFY → DOCUMENT

1. DETECT:    Error in build, test failure, or user feedback
2. ACKNOWLEDGE: "I see the issue: [specific problem]"
3. FIX:       Apply targeted fix (not rewrite everything)
4. VERIFY:    Run build/tests again to confirm fix
5. DOCUMENT:  Update CONTEXT.md with what went wrong and how fixed
```

### Common mistakes to self-correct:

| Mistake | Self-Correction |
|---------|----------------|
| Deleted a .md file | Immediately restore from git or recreate from memory |
| Broke the build | Check last 3 changes, revert if needed, fix incrementally |
| Context overflow | Summarize, save state, ask user for direction |
| Wrong dependency version | Check package.json, pin to correct version from GitHub_repos.md |
| Missing import | Check file structure, add import, verify path |

---

## 📝 DOCUMENTATION DUTY

### After every significant action, update CONTEXT.md:

```markdown
## Build Log
- [2026-06-06 12:30] Scaffooled landing page with Hero, Features, Pricing sections
- [2026-06-06 14:15] Added generator wizard with 5 steps and live preview
- [2026-06-06 16:00] Integrated LemonSqueezy checkout on pricing page
- [2026-06-06 18:30] Fixed: dark mode toggle not persisting (added localStorage)
```

### What to log:
- New files created
- Dependencies installed
- Features completed
- Bugs fixed
- Design decisions made
- Files that were modified

---

## 🎨 DESIGN SYSTEM ENFORCEMENT

### Every project must follow its CONTEXT.md design spec:

```
If CONTEXT.md says:
  - Background: #000000
  - Font: Geist
  - Radius: 8px

Then EVERY component must use:
  - bg-black or bg-[#000000]
  - font-geist or font-sans (with Geist loaded)
  - rounded-lg (8px) or rounded-md (6px)

NO exceptions. NO "I'll use a different color because it looks better."
```

### If design spec is unclear:
- Default to **Vercel aesthetic**: dark mode, minimal, generous whitespace, subtle gradients
- Use **shadcn/ui** components as base
- Ask user: "Design spec is missing [X]. Should I use Vercel-style default or do you have a preference?"

---

## 🔧 MCP & SKILLS AUTOMATION

### When project needs a capability:

```
1. Check MCP.md for relevant server
   Example: Need web search? → Use Brave Search MCP
   Example: Need browser testing? → Use Playwright MCP

2. Check SKILLS.md for relevant skill
   Example: Need SEO? → Use "SEO Optimizer" skill
   Example: Need accessibility? → Use "Accessibility Auditor" skill

3. Install if missing:
   - MCP: Add to mcp-config.json per MCP.md instructions
   - Skills: Run install command from SKILLS.md

4. Verify: Test that MCP/skill responds correctly
```

### Common MCP triggers:

| Task | MCP to Use |
|------|-----------|
| Search competitor features | Brave Search |
| Fetch docs/API reference | Fetch |
| Read local file structure | Filesystem |
| Test UI in browser | Playwright |
| Complex reasoning | Sequential Thinking |
| Remember user preferences | Memory |

---

## 🚀 DEPLOYMENT AUTOMATION

### Before every deploy:

```bash
# 1. Build check
npm run build
# Must exit 0. If not, fix errors first.

# 2. Lint check
npm run lint
# Must pass. If not, fix linting issues.

# 3. Test check (if tests exist)
npm run test
# Must pass. If not, fix failing tests.

# 4. Git commit
 git add .
 git commit -m "feat: [description]"

# 5. Push to deploy
 git push origin main
# Cloudflare Pages auto-deploys on push
```

### If deploy fails:

```
1. Check Cloudflare Pages dashboard for error logs
2. Common issues:
   - wrangler.toml misconfigured → verify per CONTEXT.md
   - Missing environment variables → check .env.example
   - Build command wrong → verify astro.config.mjs output: 'static'
3. Fix and push again
4. Update CONTEXT.md with deploy status
```

---

## 💬 COMMUNICATION STYLE

### When reporting to user:

```
✅ GOOD: "Completed: Landing page with Hero, 6 feature cards, and pricing section. 
          Files created: src/pages/index.astro, src/components/Hero.astro, etc.
          Next: Generator wizard page."

❌ BAD: "Done." (no context, no file list, no next steps)
```

### When asking for help:

```
✅ GOOD: "Build is failing with error: [paste exact error]. 
          Last change: modified src/lib/seo.ts. 
          Tried: reverting seo.ts, still fails. 
          Need: help identifying root cause."

❌ BAD: "It's broken." (no details, no context)
```

---

## 📋 PROJECT-SPECIFIC CHECKLISTS

### For privacypolgen.com (Tool #1) — status as of 2026-06-06:

```
[✅] Landing page: Hero, TrustBar, FeatureGrid, HowItWorks, Comparison, Pricing, FAQ, Footer
[✅] Generator: 5-step wizard (Wizard.tsx, 22KB) with PolicyView preview pane
[✅] Export: HTML, Markdown, plain text (PolicyReader.tsx + PolicyView.tsx)
[⏳] Export: DOCX + PDF (premium) — NOT YET BUILT
[✅] Shareable links: /p?h=<hash> (LZW + base64url, URL query, not path segment)
[⏳] Edit-key: localStorage round-trip — NOT YET BUILT (hash is one-way round-trip only)
[⏳] Pricing: Free vs Premium — page exists, LemonSqueezy checkout NOT YET WIRED
[⏳] SEO: Schema markup (SoftwareApplication, FAQPage) — NOT YET BUILT
[✅] SEO: meta tags, OG image, sitemap, robots.txt
[✅] Dark mode: default dark, OS-pref fallback, localStorage persist, FOUC-safe
[✅] Examples: 4 sample policies (personal blog, SaaS, e-commerce, mobile app)
[✅] Mobile responsive: tested at 320px+, mobile-first CSS
[⏳] Tests: vitest + generator.ts unit tests — NOT YET BUILT
[⏳] Lint/format: ESLint + Prettier — NOT YET CONFIGURED
[⏳] Cloudflare Pages deploy: wrangler.toml + GitHub Action — NOT YET BUILT
[⏳] Analytics: GA4 + Plausible — NOT YET INSTALLED
```

Status legend: ✅ done · 🟡 in progress · ⏳ not started / planned

For ground truth and detailed file map, see `CONTEXT.md`.
```

### For every tool:

```
[ ] CONTEXT.md exists and is current
[ ] All .md files preserved in project root
[ ] package.json dependencies match GitHub_repos.md
[ ] Build passes: npm run build (exit 0)
[ ] Deploy passes: git push → Cloudflare Pages success
[ ] Analytics: GA4 + Plausible scripts included
[ ] Payments: LemonSqueezy checkout integrated (if monetized)
[ ] SEO: Title, description, schema, OG tags on every page
```

---

## 🔄 END-OF-SESSION PROTOCOL

### Before ending any session:

```
1. Git status: Check what's changed
2. Git commit: Commit all changes with conventional commit message
3. Update CONTEXT.md: Log all work done in this session
4. Verify .md files: Confirm all 5 .md files exist in project root
5. Report to user: Summary of completed work + next steps
6. Save state: If context is full, summarize and save to CONTEXT.md
```

### Session summary template:

```markdown
## Session Summary [2026-06-06]
**Completed:**
- Feature X implemented
- Bug Y fixed
- File Z created

**Files Modified:**
- src/pages/index.astro
- src/components/Hero.astro
- CONTEXT.md

**Next Steps:**
- Build generator wizard page
- Add LemonSqueezy integration
- Write SEO blog posts

**Blockers:**
- None / [describe if any]
```

---

## 🚨 EMERGENCY PROTOCOLS

### If you accidentally delete files:

```
1. STOP immediately. Do not continue coding.
2. Check git: git status, git log --oneline -5
3. If committed: git checkout HEAD -- [filename]
4. If not committed: Recreate from memory using templates below
5. Verify restoration: ls -la *.md
6. Report to user: "I accidentally deleted [files]. Restored from [source]."
```

### If build is completely broken:

```
1. Check last git commit: git log --oneline -1
2. Try reverting: git revert HEAD (if last commit caused it)
3. If uncommitted changes broke it: git stash
4. Rebuild from last known good state
5. Apply changes incrementally, testing after each
```

### If you lose context:

```
1. Read CONTEXT.md fully
2. Read AGENT.md (this file) fully
3. Check git log for recent changes
4. Ask user: "I lost context on [X]. Can you confirm current priority?"
```

---

## 📎 TEMPLATES FOR RECREATING DELETED FILES

### If CONTEXT.md was deleted, recreate:

```markdown
# [Tool Name] — Context for AI Assistants

## Project Overview
- **Name**: [Tool Name]
- **Domain**: [domain].com
- **Purpose**: [One-line description]
- **Target Audience**: [Who uses this]
- **Primary Keywords**: [Top 3 SEO keywords]
- **Monetization**: [Free / Freemium / Premium]
- **Build Status**: [In Progress / Live / Maintaining]

## Tech Stack
1. Framework: Astro.js v5 (Static)
2. Styling: Tailwind CSS v4
3. Components: React 18 (Islands)
4. UI Library: shadcn/ui
5. Hosting: Cloudflare Pages
6. Payments: LemonSqueezy
7. Analytics: GA4 + Plausible

## Core Features
- [Feature 1]
- [Feature 2]
- [Feature 3]

## SEO Strategy
- Primary keyword: [keyword]
- Schema markup: [Calculator/FAQ/HowTo]

## Roadmap
- v1.0 — MVP Launch
- v1.1 — [Feature]

## Build Log
- [Date] — [Action taken]
```

### If SKILLS.md was deleted, recreate from GitHub_repos.md + known skills
### If MCP.md was deleted, recreate from ~/.claude/mcp-config.json or default config
### If GitHub_repos.md was deleted, recreate from package.json dependencies + known repos

---

## ✅ FINAL CHECKLIST — BEFORE EVERY RESPONSE

```
[ ] Did I read CONTEXT.md before making changes?
[ ] Did I preserve all .md files?
[ ] Did I follow the design system from CONTEXT.md?
[ ] Did I install required skills/MCPs before using them?
[ ] Did I run build and verify it passes?
[ ] Did I update CONTEXT.md with my changes?
[ ] Did I report specific files modified to the user?
[ ] Did I suggest clear next steps?
```

---

*AGENT.md is the brain of your coding agent. Keep it loaded. Follow it religiously. It prevents disasters.*
