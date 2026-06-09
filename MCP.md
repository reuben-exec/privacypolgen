# MCP.md — Model Context Protocol Servers
## For: 8 Micro-SaaS Tools (Astro.js + Cloudflare + LemonSqueezy)

---

## 📌 PURPOSE

This document catalogs the MCP (Model Context Protocol) servers used across all 8 tools. MCP servers extend Claude's capabilities by connecting to external tools, data sources, and services through a standardized interface.

**Last Updated:** 2026-06-02
**Protocol Version:** MCP 2026 v2.x

---

## 🔧 COMMON MCP SERVERS (All 8 Tools)

These 7 servers are installed globally and used across every project.

---

### 1. Filesystem MCP Server
**Category:** File Access
**Rating:** 9.5/10
**Cost:** Free (Open Source)
**Install:**
```bash
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /path/to/projects
```

**Capabilities:**
- Read/write files in project directories
- Directory listing and traversal
- File search and grep
- Log file analysis
- Configuration file editing

**Use Cases:**
- Read CONTEXT.md at session start
- Search for files by pattern (`find all .test.ts files`)
- Edit configuration files (astro.config.mjs, package.json)
- Analyze build logs for errors
- Batch rename/refactor files

**Token Cost:** Very Low (best efficiency)
**Safety:** Read-only by default. Write access restricted to project directories.

**Example Prompt:**
```
"Find all files that import 'useLocalStorage' and show me their usage patterns"
"Read the last 50 lines of the build log and identify the error"
```

---

### 2. GitHub MCP Server
**Category:** Version Control
**Rating:** 9.4/10
**Cost:** Free (requires GitHub PAT)
**Install:**
```bash
claude mcp add github --env GITHUB_PERSONAL_ACCESS_TOKEN="your_pat" -- npx -y @modelcontextprotocol/server-github
```

**Capabilities:**
- Repository management (create, clone, fork)
- Pull request operations (create, review, merge)
- Issue triage and management
- Code search across repos
- Commit history analysis
- Branch management

**Use Cases:**
- Create PRs after feature completion
- Review code changes before merge
- Search for patterns across all 8 repos
- Automated issue creation for bugs
- Release management

**Token Cost:** Medium (7-32x CLI equivalent)
**Safety:** Use fine-grained PAT with minimal permissions (repo, read:org)

**Example Prompt:**
```
"Create a PR for the recipe-scaling feature with a detailed description"
"Show me the diff between main and the feature branch"
"Search all repos for 'useState' usage to find inconsistent patterns"
```

---

### 3. Context7 MCP Server
**Category:** Documentation
**Rating:** 8.0/10
**Cost:** Completely Free
**Install:**
```bash
claude mcp add context7 -- npx -y @modelcontextprotocol/server-context7
```

**Capabilities:**
- Up-to-date documentation for libraries
- Version-specific API references
- Code examples from official docs
- Structured documentation queries

**Use Cases:**
- Fetch latest Astro.js API docs
- Get Tailwind CSS v4 class references
- Look up shadcn/ui component props
- Verify React 19 patterns
- Check TypeScript strict mode rules

**Token Cost:** Medium (1K-5K tokens per query)
**Safety:** Read-only. No code execution.

**Example Prompt:**
```
"What's the correct way to use client:visible in Astro.js v5?"
"Show me the latest Tailwind CSS container query syntax"
"What props does the shadcn/ui Dialog component accept?"
```

---

### 4. Brave Search MCP Server
**Category:** Web Search
**Rating:** 9.1/10
**Cost:** $5 per 1,000 queries (free tier discontinued 2025)
**Install:**
```bash
claude mcp add brave-search --env BRAVE_API_KEY="your_key" -- npx -y @modelcontextprotocol/server-brave-search
```

**Capabilities:**
- Independent search index (not Google wrapper)
- Web search, local search, image/video/news search
- Summarizer (Pro plan)
- 7 streamlined tools (reduced from 36 in v2.x)

**Use Cases:**
- Research competitor features
- Find latest SEO best practices
- Look up error messages and solutions
- Verify library compatibility
- Find design inspiration

**Token Cost:** Medium
**Safety:** Read-only. No browsing history access.

**Example Prompt:**
```
"Search for 'best privacy policy generator 2026' and summarize top 3 results"
"Find recent articles about Astro.js static output performance"
"Search for competitor pricing for recipe scaling tools"
```

---

### 5. Fetch MCP Server
**Category:** Web Access
**Rating:** 8.5/10
**Cost:** Free (Open Source)
**Install:**
```bash
claude mcp add fetch -- npx -y @modelcontextprotocol/server-fetch
```

**Capabilities:**
- HTTP requests (GET, POST, PUT, DELETE)
- JSON API interactions
- Webhook testing
- Simple page fetching (no JS rendering)

**Use Cases:**
- Test API endpoints during development
- Verify deployed sites are accessible
- Check HTTP headers and redirects
- Fetch JSON data from public APIs

**Token Cost:** Low
**Safety:** No authentication secrets stored. Manual header input.

**Example Prompt:**
```
"GET https://api.example.com/health and check the response status"
"POST to our webhook endpoint with test data and verify the response"
```

---

### 6. Sequential Thinking MCP Server
**Category:** Productivity / Reasoning
**Rating:** 9.0/10
**Cost:** Free (Open Source)
**Install:**
```bash
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
```

**Capabilities:**
- Structured problem decomposition
- Step-by-step reasoning chains
- Decision tree exploration
- Hypothesis testing

**Use Cases:**
- Break complex features into implementable steps
- Analyze trade-offs for architecture decisions
- Debug multi-step logic errors
- Plan refactoring strategies

**Token Cost:** Low input / High output
**Safety:** Internal reasoning only. No external actions.

**Example Prompt:**
```
"I need to add real-time sync to the bill splitter. Break this down into steps and analyze the trade-offs."
```

---

### 7. Memory MCP Server
**Category:** Knowledge Management
**Rating:** 8.7/10
**Cost:** Free (Open Source)
**Install:**
```bash
claude mcp add memory -- npx -y @modelcontextprotocol/server-memory
```

**Capabilities:**
- Persistent context across sessions
- Project-specific knowledge storage
- Decision log maintenance
- Pattern recognition across projects

**Use Cases:**
- Remember architecture decisions from previous sessions
- Store common bug fixes and solutions
- Maintain a "lessons learned" database
- Track evolving requirements

**Token Cost:** Low
**Safety:** Local storage only. No cloud sync.

**Example Prompt:**
```
"Remember that we decided to use localStorage instead of D1 for the first version"
"What was the solution to the hydration mismatch issue we had last week?"
```

---

## 🎯 TOOL-SPECIFIC MCP SERVERS

These servers are installed per-project based on specific needs.

---

### 8. Playwright MCP Server (Microsoft Official)
**Category:** Browser Automation
**Rating:** 9.0/10
**Cost:** Free (Open Source)
**Used By:** All 8 tools (E2E testing)
**Install:**
```bash
claude mcp add playwright -- npx -y @executeautomation/playwright-mcp-server
```

**Capabilities:**
- Navigate URLs and interact with pages
- Click, type, select elements
- Take full-page or element screenshots
- Execute JavaScript in browser context
- Run multi-step E2E scenarios
- Accessibility tree navigation (faster than screenshots)

**Use Cases:**
- Test login flows
- Verify calculator outputs in real browser
- Capture visual regression screenshots
- Test responsive layouts
- Automated deployment smoke tests

**Token Cost:** Medium-High (3-10s per operation, 500MB+ browser)
**Safety:** Local browser only. No external data leakage.

**Example Prompt:**
```
"Navigate to localhost:3000, fill out the privacy policy form, and verify the generated policy appears"
"Take a screenshot of the dashboard at 320px, 768px, and 1440px widths"
"Run through the signup flow and report any console errors"
```

---

### 9. PostgreSQL MCP Server (DBHub)
**Category:** Database
**Rating:** 9.3/10
**Cost:** Free (Open Source)
**Used By:** SplitHouseholdBills.com, PrivacyPolicyGeneratorFree.com (premium)
**Install:**
```bash
# Use read-only DSN for safety
claude mcp add postgres -- npx -y @modelcontextprotocol/server-postgres postgresql://readonly@localhost/mydb
```

**Capabilities:**
- Schema exploration
- SQL query writing and execution
- Data inspection
- Index optimization suggestions
- Migration script generation

**Use Cases:**
- Design D1 schema for cloud sync
- Optimize slow queries
- Generate seed data
- Verify data integrity

**Token Cost:** High (schema explosion risk with large DBs)
**Safety:** STRONGLY recommend read-only role. Write-capable DSN is dangerous.

**Example Prompt:**
```
"Read the schema and find the slowest query in the slow_log table"
"Write a candidate index for the expenses table and run EXPLAIN ANALYZE"
```

---

### 10. Sentry MCP Server
**Category:** Monitoring / Error Tracking
**Rating:** 8.5/10
**Cost:** Free (requires Sentry account)
**Used By:** All 8 tools (production monitoring)
**Install:**
```bash
claude mcp add sentry --env SENTRY_AUTH_TOKEN="sntrys_..." --env SENTRY_ORG="my-org" -- npx -y @sentry/mcp-server
```

**Capabilities:**
- Read recent error issues
- Group errors by frequency
- Pull stack traces and context
- Track error rate spikes
- Link errors to commits

**Use Cases:**
- Debug production errors without dashboard
- Identify error patterns post-deployment
- Prioritize bug fixes by impact
- Verify fixes resolved the issue

**Token Cost:** Medium
**Safety:** Read-only. No error creation or modification.

**Example Prompt:**
```
"Pull the latest unresolved Sentry errors in production tagged 'payment' and rank by frequency"
"Did the error rate spike after our last deploy? Check Sentry for the past 2 hours"
```

---

### 11. Firecrawl MCP Server
**Category:** Web Scraping / Research
**Rating:** 8.5/10
**Cost:** Free tier available, paid from $16/mo
**Used By:** PrivacyPolicyGeneratorFree.com (competitor research), ColorPaletteFromImage.com (inspiration)
**Install:**
```bash
claude mcp add firecrawl --env FIRECRAWL_API_KEY="fc-YOUR_KEY" -- npx -y @mendableai/firecrawl-mcp
```

**Capabilities:**
- JavaScript-rendered web scraping
- Batch URL processing
- Structured data extraction
- Markdown conversion
- Sitemap crawling
- Anti-bot handling

**Use Cases:**
- Crawl competitor pricing pages
- Extract structured data from documentation
- Batch process URLs for content research
- Scrape SPA content (React/Vue rendered)

**Token Cost:** Medium
**Safety:** Respects robots.txt. Rate-limited.

**Example Prompt:**
```
"Crawl our competitor's pricing docs and extract plan names and feature tables as JSON"
"Scrape the top 10 recipe blogs and extract their substitution guides"
```

---

### 12. Figma MCP Server
**Category:** Design Handoff
**Rating:** 8.0/10
**Cost:** Free (requires Figma account)
**Used By:** All 8 tools (design-to-code)
**Install:**
```bash
claude mcp add figma --env FIGMA_API_KEY="your_key" -- npx -y @modelcontextprotocol/server-figma
```

**Capabilities:**
- Read Figma file structures
- Extract design tokens (colors, typography, spacing)
- Export assets (SVG, PNG)
- Generate CSS from designs

**Use Cases:**
- Convert Google Stitch designs to code
- Extract color palettes from design files
- Generate Tailwind config from Figma tokens
- Asset export automation

**Token Cost:** Medium-High
**Safety:** Read-only. No design modifications.

**Example Prompt:**
```
"Read the Figma file for the recipe tool and extract the color palette and typography scale"
"Generate Tailwind CSS config from the design tokens in this Figma file"
```

---

### 13. Cloudflare MCP Servers (Remote)
**Category:** Infrastructure
**Rating:** 8.1/10
**Cost:** Free (requires Cloudflare account)
**Used By:** All 8 tools (deployment, DNS, Workers)
**Install:**
```bash
# Cloudflare released 13 remote MCP servers in April 2026
# No local installation needed — connect directly to Cloudflare
claude mcp add cloudflare --env CLOUDFLARE_API_TOKEN="your_token" -- npx -y @cloudflare/mcp-server
```

**Capabilities:**
- D1 database management
- R2 object storage
- Workers deployment and logs
- DNS management
- Page rules configuration
- Analytics queries

**Use Cases:**
- Deploy Workers without leaving editor
- Check build logs for failed deployments
- Manage environment variables
- Configure custom domains
- Query analytics data

**Token Cost:** Managed (no local context)
**Safety:** API token scoped to specific zones/services.

**Example Prompt:**
```
"Deploy the main branch to Cloudflare Pages and show me the build log"
"Check the D1 database schema for the bill splitter and suggest optimizations"
```

---

## 📊 MCP SERVER COMPARISON

| Server | Category | Cost | Token Cost | Setup | All Tools? |
|--------|----------|------|-----------|-------|-----------|
| Filesystem | File Access | Free | Very Low | Easy | Yes |
| GitHub | Version Control | Free | Medium | Easy | Yes |
| Context7 | Documentation | Free | Medium | Easy | Yes |
| Brave Search | Web Search | $5/1K queries | Medium | Easy | Yes |
| Fetch | Web Access | Free | Low | Easy | Yes |
| Sequential Thinking | Reasoning | Free | Low/High | Easy | Yes |
| Memory | Knowledge | Free | Low | Easy | Yes |
| Playwright | Browser | Free | High | Moderate | Yes (testing) |
| PostgreSQL | Database | Free | High | Moderate | 2 tools |
| Sentry | Monitoring | Free | Medium | Easy | Yes (prod) |
| Firecrawl | Scraping | Free tier | Medium | Easy | 2 tools |
| Figma | Design | Free | Medium-High | Easy | As needed |
| Cloudflare | Infrastructure | Free | Managed | Moderate | Yes |

---

## 🚀 RECOMMENDED STARTER CONFIGURATION

### Minimal Setup (Beginner)
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/projects"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "your_pat" }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-context7"]
    }
  }
}
```

### Full Setup (All 8 Tools)
```json
{
  "mcpServers": {
    "filesystem": { ... },
    "github": { ... },
    "context7": { ... },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": { "BRAVE_API_KEY": "your_key" }
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "sntrys_...",
        "SENTRY_ORG": "my-org"
      }
    },
    "cloudflare": {
      "command": "npx",
      "args": ["-y", "@cloudflare/mcp-server"],
      "env": { "CLOUDFLARE_API_TOKEN": "your_token" }
    }
  }
}
```

---

## ⚠️ MCP BEST PRACTICES

1. **Start Minimal:** Install 3-4 servers first. Add more as needed. Bloated tool lists hurt decision quality.
2. **Read-Only First:** Use read-only database connections. Write access is a footgun.
3. **Token Budget:** Each server adds to context. Monitor token usage with `claude mcp status`.
4. **Security:** Treat MCP servers like npm packages. Only install from verified sources.
5. **Rate Limits:** Brave Search and Firecrawl have API limits. Monitor usage to avoid surprises.
6. **Local vs Remote:** Prefer local servers (Filesystem, Playwright) over remote (Cloudflare) for latency-sensitive tasks.

---

*MCP ecosystem doubles every few months. Bookmark github.com/modelcontextprotocol/servers for the canonical list.*
