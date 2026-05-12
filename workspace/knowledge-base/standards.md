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
