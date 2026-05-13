# Architectural Decisions

> Append one entry per reusable decision. Newest at the bottom.
> Format: ADR-#### · YYYY-MM-DD · Title · Context · Decision · Consequences

---

## ADR-0001 · 2026-05-13 · Stdlib-only Node server for static-deliverable widgets

- **Context.** Small customer-facing artifacts (e.g. Hello-Card, TCK-20260513-0001) that the customer self-hosts. Adding npm dependencies adds CVE surface and license-audit overhead.
- **Decision.** For widgets ≤ 1 working-day in scope, the backend uses Node ≥ 18 stdlib only (`http`, `fs/promises`, `crypto`). State is a single-file JSON, persisted via `write-temp + rename`. Concurrency via in-process promise-chain lock.
- **Consequences.** Zero supply-chain risk; no `npm audit` step in CI; trivially self-hostable. Scales to a single process — for multi-instance, revisit with SQLite or Redis.

## ADR-0002 · 2026-05-13 · DSGVO-konformer Rate-Limit ohne IP-Speicherung

- **Context.** Public POST endpoints need rate limiting, but storing IPs (even briefly) creates DSGVO exposure.
- **Decision.** Token-bucket keyed by `SHA-256(IP + per-process random daily salt)`. Bucket map lives in RAM; salt is regenerated on process restart, never persisted. Buckets expire after the rate-limit window.
- **Consequences.** No personal data ever lands on disk. Restart resets buckets (acceptable for v0.x). Cross-instance coordination would need a shared, salted store.
