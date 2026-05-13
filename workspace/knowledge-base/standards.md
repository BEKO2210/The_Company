# Company Standards (default — refine over time)

## Coding
- Languages: TypeScript (frontend), Python or TypeScript (backend), Kotlin/Swift (mobile)
- Style: prettier + eslint (TS), black + ruff (Python)
- Tests: ≥80% coverage on changed code, no flaky tests in main
- Commits: Conventional Commits (feat:, fix:, chore:, ...)

## UX
- Accessibility: WCAG 2.2 AA minimum
- Performance budget: LCP < 2.5s, INP < 200ms, CLS < 0.1 on mid-tier mobile
- Mobile-first responsive

## Security
- No secrets in source. Use env vars or a secrets manager.
- All inputs validated at trust boundaries
- Auth required for all non-public endpoints
- Rate limiting on auth endpoints

## Privacy (DSGVO)
- Data minimization by default
- Explicit consent for non-essential cookies/tracking
- 30-day retention default for logs unless otherwise specified
- Right to erasure must be technically achievable

## Brand
- Tone: professional, clear, no marketing fluff
- Visual: minimalist, generous whitespace, ≤5 colors per surface
- Voice (German): Sie-Form für Kundenkommunikation

## Skills — Role Mapping

Skills are installed under `.agents/skills/` (universal store) and symlinked into `.claude/skills/`. They activate via trigger words in the task, not by agent role. The table below documents which skills back which subagent — orchestrator and reviewers consult this when planning work.

| Subagent             | Installed skills                                                                              |
|----------------------|-----------------------------------------------------------------------------------------------|
| ceo                  | ceo-advisor, board-meeting                                                                    |
| cto                  | cto-advisor, senior-architect, tech-debt-tracker, claude-api                                  |
| product-owner        | product-manager-toolkit, agile-product-owner, product-strategist                              |
| project-manager      | senior-pm, scrum-master, jira-expert, confluence-expert                                       |
| ux-designer          | ux-researcher-designer                                                                        |
| ui-designer          | frontend-design, web-artifacts-builder                                                        |
| brand-guardian       | brand-guidelines                                                                              |
| frontend-engineer    | frontend-design, senior-frontend, web-artifacts-builder                                       |
| backend-engineer     | senior-backend, api-design-reviewer, api-test-suite-builder, claude-api                       |
| mobile-engineer      | — (no installed mobile skill yet; consider community: ios-simulator-skill, expo)              |
| database-engineer    | database-designer, database-schema-designer, migration-architect                              |
| devops-engineer      | ci-cd-pipeline-builder, monorepo-navigator                                                    |
| sre                  | observability-designer, incident-commander, runbook-generator, performance-profiler           |
| qa-engineer          | senior-qa, webapp-testing                                                                     |
| code-reviewer        | pr-review-expert                                                                              |
| security-officer     | senior-security, ciso-advisor, skill-security-auditor, dependency-auditor                     |
| privacy-officer      | gdpr-dsgvo-expert                                                                             |
| compliance-auditor   | information-security-manager-iso27001, soc2-compliance, dependency-auditor (licensing)        |
| account-manager      | internal-comms, docx                                                                          |
| support-engineer     | incident-commander, runbook-generator                                                         |
| technical-writer     | docx, pptx, codebase-onboarding, changelog-generator                                          |
| release-manager      | release-manager (skill), changelog-generator                                                  |
| archivist            | —                                                                                             |

Cross-cutting (firm-wide): `skill-creator`, `mcp-builder`, `pdf`, `xlsx`.

**Removed during bootstrap (do not reinstall without re-evaluation):**
- `env-secrets-manager` — Snyk Critical Risk on a dependency. Re-evaluate when upstream patches.

**Drift rule:** Every external skill package must pass `skill-security-auditor` before being added to `skills-lock.json`. The lock file is the authoritative record of what is installed.

**Known acceptable Gen-False-Positives** (scanner flags the skill's *own* defensive patterns):
- `skill-security-auditor` (Gen: High) — contains the very patterns it searches for.
- `ci-cd-pipeline-builder`, `observability-designer` (Gen: High) — generate shell/YAML by design.
- `database-designer` (Gen: Med) — emits DDL strings.
