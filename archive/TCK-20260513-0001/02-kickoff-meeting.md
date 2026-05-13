# Kickoff Meeting — TCK-20260513-0001

- Facilitator: project-manager
- Timestamp: 2026-05-13T00:13:00Z
- Attendees (subagents weighed in): frontend-engineer (lead), backend-engineer (lead), security-officer + privacy-officer (joint), ceo (sign-off), product-owner

## Department inputs (verbatim)

### Frontend Lead

1. **Component shape** — Single self-contained `hello-card.html` (inline `<style>` + `<script>`) plus optional `hello-card.js` for embedding via `<script src>` + `<div id="hello-card">`. Customer drops one HTML file on any static host; counter calls `/api/visit`.
2. **Tech choice** — Vanilla HTML/CSS/JS. No framework, no build step, no dependencies.
3. **States** — name absent · name present · counter loading (`aria-busy`) · counter success · counter error (graceful fallback).
4. **Accessibility** — `<section aria-labelledby>`, `<h1>` greeting, `aria-live="polite"` on counter, focus-visible, `prefers-color-scheme`, `prefers-reduced-motion`, contrast ≥4.5:1, name HTML-escaped.
5. **Open questions** — name length cap, counter URL config, per-page vs global counter, rate-limit strategy without IP logging, embed mode (standalone vs snippet).

### Backend Lead

1. **API** — `POST /api/visit` returns `{count}`. Optional `GET /api/visit` read-only.
2. **Storage** — `counter.json` (single integer). Zero deps, self-hostable.
3. **Concurrency** — In-memory counter behind async mutex; flushed via `write-temp + rename`.
4. **Hardening** — 30 req/min per IP (in-memory token bucket, IP hashed + dropped after window). CORS configurable. Body ≤ 1 KB. Method allow-list. CSP / X-Content-Type-Options / Referrer-Policy headers.
5. **Open questions** — single global counter or per-host? Server-side name cap? Initial counter value (0)?

### Security & Privacy

1. **Threats** — XSS via `?name=`; counter abuse (floods, overflow, race); inadvertent PII via access logs.
2. **Privacy MUSTs** — no cookies/storage/fingerprinting; no IP/UA/Referer logging; name client-side only, never sent to backend; only an aggregate integer persisted; no third-party requests; logs disabled or stripped + ≤7d retention.
3. **Security MUSTs** — name HTML-escaped, length ≤ 64, control chars rejected; POST-only counter, rate limit without IP storage, atomic write; CSP / nosniff / no-referrer / minimal Permissions-Policy.
4. **Will FAIL gate without** — access-log policy, XSS escape rule, IP-less rate limit, CSP header.

## Decisions made (project-manager + ceo sign-off)

1. **One file deliverable** — `hello-card.html` (standalone). Snippet embed deferred to a v0.2.0 if requested.
2. **Counter scope** — One global counter (single integer). Per-host can be a v0.x feature.
3. **Name cap** — ≤ 64 characters, ASCII letters/digits/spaces/hyphens/periods only. Reject anything else by silently dropping invalid chars client-side; do not send `name` to the backend.
4. **Counter endpoint URL** — Configurable via `data-counter-url` attribute on the embed `<div>`, default `/api/visit`.
5. **Initial counter value** — 0. Persisted at first POST.
6. **Rate limit** — Token bucket keyed by SHA-256 of `IP + daily_salt`, bucket discarded at end of window. Salt is per-process and never persisted.
7. **Access logs** — `nginx`/server config sample in delivery turns logging off; if customer keeps logs, README spells out the 7-day strip-IP retention.

## Open risks

- R1: Customer self-hosts behind a reverse proxy that overrides `X-Forwarded-For`. Mitigation: README guidance.
- R2: Counter file lives next to the binary; backup/permissions are customer's responsibility. Mitigation: README + chmod recommendation.

## Workstream owners

| Workstream | Owner agent       | Deadline (in-loop)     |
|------------|-------------------|------------------------|
| Spec       | product-owner     | end of STEP 5          |
| UX/UI/Brand| ux+ui+brand       | end of STEP 5          |
| Frontend   | frontend-engineer | end of STEP 6          |
| Backend    | backend-engineer  | end of STEP 6          |
| DB/storage | database-engineer | end of STEP 6 (trivial)|
| DevOps     | devops-engineer   | end of STEP 6          |
| SRE        | sre               | end of STEP 6          |
| Docs       | technical-writer  | end of STEP 6          |
| QA         | qa-engineer       | STEP 7 (Gate A)        |
| Security   | security-officer  | STEP 7 (Gate A)        |
| CTO review | cto               | STEP 7 (Gate A)        |
| Privacy    | privacy-officer   | STEP 8 (Gate B)        |
| Compliance | compliance-auditor| STEP 8 (Gate B)        |
| UX accept  | ux-designer       | STEP 8 (Gate B)        |
| Release    | release-manager   | STEP 9                 |
| Customer   | account-manager   | STEP 10                |
| Archive    | archivist         | STEP 11                |

**No customer email required.** Proceed to STEP 5.
