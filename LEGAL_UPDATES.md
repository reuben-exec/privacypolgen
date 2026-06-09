# Legal Template Update Log — PrivacyPolGen

> This file tracks the quarterly review cadence for legal templates in
> `src/data/clauses.json`, `src/data/laws.json`, and related data files.
>
> **Cadence**: Every 3 months (March, June, September, December)
> **Owner**: Project maintainer
> **Sources monitored**:
> - EU: EUR-Lex / EDPB guidelines (https://edpb.europa.eu/)
> - US: State privacy law trackers (IAPP: https://iapp.org/resources/tracker/)
> - Brazil: ANPD (https://www.gov.br/anpd/)
> - India: MeitY DPDP Act updates
> - Canada: OPC guidance (https://www.priv.gc.ca/)
> - Singapore: PDPC (https://www.pdpc.gov.sg/)
> - Global: IAPP global privacy law map

---

## 2026 Q2 (June 8, 2026)

### Status: Initial baseline

**Review scope**:
- Initial baseline of all clauses in `src/data/clauses.json`
- Laws definitions in `src/data/laws.json`
- Business types in `src/data/businessTypes.json`
- Terms of Service (Section 3: Not Legal Advice, Section 5: Limitation of
  Liability, Section 6: Indemnification)

**Changes made**:
- Fixed `[Your Jurisdiction]` placeholder → State of Delaware, United States
  (with local-rights saving clause)
- Added "Not legal advice" disclaimer embedded in all generated policy output
  (Markdown, HTML, plain text)

**Sources consulted**:
- N/A — initial baseline establishment

**Next review due**: September 1, 2026

---

## Template for Future Entries

```markdown
## [YYYY QN] (Month DD, YYYY)

### Status: [Up-to-date | Changes needed | Overdue]

**Review scope**:
- [List sections/directives/clauses reviewed]

**Changes made**:
- [Specific changes with rationale]

**Sources consulted**:
- [Regulatory updates and citations]

**Next review due**: [Month DD, YYYY]
```
