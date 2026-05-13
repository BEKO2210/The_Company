# Spec — TCK-20260513-0001 · Hello-Card

- Author: product-owner
- Timestamp: 2026-05-13T00:14:00Z
- Sign-off: ceo (strategic), cto (architecture)

## Goal

A single self-hostable HTML file that renders a friendly greeting to a visitor (name from `?name=`) and shows an anonymous, server-aggregated visit counter — fully DSGVO-compliant.

## User stories

- **As a website visitor**, I want to see a personalized greeting (when my name is in the URL) so that the page feels welcoming.
- **As a website visitor with no name in the URL**, I want to see a neutral greeting so the card still renders meaningfully.
- **As the site owner (Belkis)**, I want a global visit counter so I know how often the card is shown — without storing any personal data.
- **As the site owner**, I want to drop the artefact onto any static host with a minimal Node process so that hosting stays simple.

## Acceptance criteria (binary, testable)

| # | Criterion |
|---|---|
| AC-1  | `hello-card.html` renders without external network requests (no CDN). |
| AC-2  | With `?name=Belkis`, the H1 reads "Hallo, Belkis". |
| AC-3  | Without `?name=`, the H1 reads "Willkommen". |
| AC-4  | A `<script>` injected via `?name=<script>alert(1)</script>` is rendered as text, never executed. |
| AC-5  | Names longer than 64 visible chars are truncated; invalid chars are silently dropped client-side. |
| AC-6  | The counter renders within 2 s on a 4G connection (uncached) or shows a graceful fallback. |
| AC-7  | `POST /api/visit` returns `{ "count": <int> }` and persists across server restarts. |
| AC-8  | Concurrent POSTs (≥ 50 in parallel) result in the correct final count (no lost updates). |
| AC-9  | Rate limit: ≤ 30 POSTs/min per source. The 31st returns HTTP 429. No IPs are persisted. |
| AC-10 | No cookies, no localStorage, no sessionStorage are set by the page or the API. |
| AC-11 | Response headers include `Content-Security-Policy: default-src 'self'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`. |
| AC-12 | Dark/Light Mode switches automatically via `prefers-color-scheme`. |
| AC-13 | Card reflows correctly at ≥ 320 px viewport width. |
| AC-14 | All interactive/visible text meets WCAG 2.2 AA contrast (≥ 4.5:1 normal, ≥ 3:1 large). |
| AC-15 | The counter region uses `aria-live="polite"`. |
| AC-16 | `prefers-reduced-motion: reduce` disables any animation. |
| AC-17 | README explains: how to start the server, how to embed the card, how access logging must be configured (no IPs / ≤ 7 d retention). |

## Out of scope (explicit)

- Authentication / user accounts.
- Per-host counters or namespacing.
- Internationalization (German + English fallback strings only).
- Snippet-mode embed (`<script src>` integration on a third-party page) — v0.2.0 candidate.
- Persistent rate-limit storage beyond process lifetime.

## Open questions

None — all kickoff blockers resolved by the decisions in `02-kickoff-meeting.md`.

## CTO architecture sign-off

- Stack: vanilla HTML/CSS/JS + Node ≥ 18 stdlib (`http`, `fs/promises`). No npm dependencies.
- Failure modes considered: (a) disk full → POST returns 503, counter held in memory; (b) corrupt JSON → fall back to last in-memory value, log to stderr, do not block service; (c) clock skew → not in scope (no time-based logic).
- Observable via `GET /healthz` returning `{ "status": "ok", "count": <int> }`.
- Rollback: previous version's folder is the rollback target; counter file forward-compatible.
- **Signed off** — proceed to STEP 6.
