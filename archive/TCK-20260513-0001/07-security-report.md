# Gate Report: A2 Security Gate

- Ticket: TCK-20260513-0001
- Reviewer (subagent): security-officer
- Timestamp: 2026-05-13T00:18:30Z
- Verdict: **PASS**
- Severity: n/a

## Findings

1. **XSS — safe.** Name rendered via `textContent` (`frontend/hello-card.html:88`); allowlist regex + 64-char truncate (`hello-card.html:75-81`). AC-4 holds. Server never reflects the name.
2. **Injection / SSRF — none.** No user input reaches `fs`, `child_process`, or outbound calls. Static path locked to `/` and `/hello-card.html` (`server.js:86`); `path.join` with fixed filename → no traversal.
3. **Rate limit — present & configurable.** Token bucket (`server.js:55-71`), env-tunable `RATE_PER_MIN` default 30, returns 429, janitor caps map at 10 k. IPs hashed with per-process random salt, never persisted.
4. **Security headers — set on every response.** CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy via `writeHeaders` (`server.js:19-24, 73-77`).
5. **Secrets — none hardcoded.** Only crypto material: ephemeral salt.
6. **Dependencies — zero** (`package.json` empty `dependencies`).
7. **Body cap — 1 KB** present (`server.js:17, 110-111`).
8. **Atomic write / race — safe.** Promise-chain lock (`server.js:28, 115-119`) + tmp-rename (`server.js:43-47`).

## Evidence

- `frontend/hello-card.html:75-88`
- `backend/server.js:19-24, 28-29, 43-47, 55-71, 86-92, 107-126`
- `backend/package.json:12` (zero deps)
- `devops/Dockerfile:7-8` (non-root UID 10001)
- `devops/nginx.sample.conf:8-15` (no access logs, headers stripped)

## Required actions

None — gate PASS. Non-blocking hardening for a future version:
- Externalize the inline script so CSP can drop `'unsafe-inline' script-src`.
- Add `Cross-Origin-Resource-Policy` and `Cross-Origin-Opener-Policy` at the proxy.
- HSTS at nginx.

---

# Gate Report: B2 Privacy Gate

- Ticket: TCK-20260513-0001
- Reviewer (subagent): privacy-officer
- Timestamp: 2026-05-13T00:24:30Z
- Verdict: **PASS**

## Findings

1. **Data minimization** — only the client IP touches `server.js:51`, used solely as `sha256(IP + daily_salt)` for rate limiting. Never stored, never logged, never sent anywhere. No `User-Agent`, no `Referer`, no `name` server-side.
2. **Consent** — N/A. No personal data collected; DSGVO Art. 6(1)(f) applies for the integer counter + ephemeral hash.
3. **Retention** — Counter (non-personal integer) is keep-forever. Rate-limit buckets RAM-only, 60 s window. `nginx.sample.conf` disables access logs; README documents the 7 d strip-IP fallback.
4. **Data subject rights** — N/A trivially. Nothing to return/erase.
5. **No cookies/storage** — `frontend/hello-card.html` clean on grep for `cookie|localStorage|sessionStorage`. `<meta name="referrer" content="no-referrer">` at line 6. `?name=` stays client-side; POST body is empty.
6. **Sub-processors / DPAs** — none. Only same-origin `fetch("/api/visit")`. No CDN, no fonts, no analytics. System fonts only.
7. **Documentation** — `docs/README.md` lines 73-80 state the DSGVO posture explicitly.

## Evidence

- `backend/server.js:29-30, 45, 49-53, 58, 67-69`
- `frontend/hello-card.html:6, 77-88, 94`
- `devops/nginx.sample.conf:9, 13-15`
- `docs/README.md:73-80`

## Required actions

None.
