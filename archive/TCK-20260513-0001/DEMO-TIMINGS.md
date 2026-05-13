# Dry-Run Timings — TCK-20260513-0001 · Hello-Card v0.1.0

> First end-to-end run of the BK One operating loop, with one realistic loop-back
> (Gate A1 FAIL → fix → re-PASS). All timestamps UTC, taken from file mtimes and
> `logs/*.log`. Agent-call durations measured by the Task tool's `duration_ms`.

## Wall-clock per step

| #  | Step                              | Started (UTC) | Ended (UTC)  | Duration | Notes                                                                |
|----|-----------------------------------|---------------|--------------|----------|----------------------------------------------------------------------|
| 1  | Inbox drop + detection            | 00:11:43      | 00:11:48     | **0 m 05 s** | Brief written; `logs/inbox.log` entry.                            |
| 2  | Triage (CEO + Product Owner)      | 00:11:48      | 00:12:14     | **0 m 26 s** | Ticket folder, `00-intake.md`, `01-triage.md`, inbox cleared.    |
| 3  | Kickoff meeting (3 parallel)      | 00:12:14      | 00:13:27     | **1 m 13 s** | 3 leads in parallel (frontend, backend, security+privacy joint). |
| 4  | Customer email check              | 00:13:27      | 00:13:27     | **0 m 00 s** | Brief unambiguous — skipped.                                     |
| 5a | Spec (Product Owner)              | 00:13:27      | 00:13:56     | **0 m 29 s** | 17 acceptance criteria + CTO sign-off.                           |
| 5b | Design (UX + UI + Brand)          | 00:13:56      | 00:14:16     | **0 m 20 s** | Flow, wireframe, state catalogue, tokens, contrast check.        |
| 6  | Implementation (iter 1)           | 00:14:16      | 00:15:16     | **1 m 00 s** | HTML, server.js, package.json, Dockerfile, nginx.conf, tests, README. |
| —  | Sanity test discovers concurrency-vs-rate-limit interaction | 00:15:16 | 00:17:00 | **~1 m 44 s** | Test failed (30/50 expected). Fix: raise `RATE_PER_MIN` in concurrency test. |
| 7a | Gate A iter 1 (A1+A2+A3 parallel) | 00:17:00      | 00:18:23     | **~1 m 23 s** | **A1 FAIL** (coverage gaps), A2 PASS, A3 PASS → composite FAIL.  |
| 6b | Loop-back fixes (iter 2)          | 00:18:23      | 00:21:30     | **~3 m 07 s** | +5 tests (restart, no-cookie, body-cap, frontend static), `.eslintrc.json`. |
| 7b | Gate A1 re-run                    | 00:21:30      | 00:21:58     | **~0 m 28 s** | **A1 PASS** → composite PASS → sandbox copied to staging.        |
| 8  | Gate B (B1+B2+B3+B4 parallel)     | 00:21:58      | 00:23:55     | **~1 m 57 s** | All 4 PASS first try. Reports appended to 06/07/08.              |
| 9  | Release (release-manager only)    | 00:23:55      | 00:24:28     | **~0 m 33 s** | Copy staging → `output/03-production/v0.1.0/`, SHA-256 manifest (8 artifacts), `chmod -R a-w`. |
| 10 | Delivery email (account-manager)  | 00:24:28      | 00:25:10     | **~0 m 42 s** | German email drafted to `workspace/communication/outbound/EMAIL-0001.md`. |
| 11 | Archive + knowledge-base          | 00:25:10      | ~00:26:00    | **~0 m 50 s** | Ticket moved to `archive/`, `decisions.md` (+2 ADRs), `retros.md` updated. |
| 12 | Final status + commit             | ~00:26:00     | (this commit)| —        | This file.                                                       |

**Total wall-clock: ~14 minutes 17 seconds**, including one full loop-back through STEP 6 → STEP 7.

## Agent-call durations (Task tool)

| Step | Agents | Parallel? | Individual durations (s) | Wall (max + ~2s overhead) |
|------|--------|-----------|--------------------------|---------------------------|
| 3 — Kickoff iter 1     | 3 | yes | 11.9 / 13.4 / 21.2 | **~21 s** |
| 7 — Gate A iter 1      | 3 | yes | 43.3 / 28.0 / 30.4 | **~43 s** |
| 7 — Gate A1 iter 2     | 1 | n/a | 28.4               | **~28 s** |
| 8 — Gate B             | 4 | yes | 25.8 / 29.1 / 26.9 / 30.9 | **~31 s** |
| **Total LLM-time**     |   |     | **289.3 s sequential / 123 s parallel** | |

## Throughput facts

- **8 release artefacts** (`output/03-production/v0.1.0/`), 7 gates passed.
- **10 automated tests** in the final suite, 100 % pass on two consecutive runs, max latency 2 786 ms / suite.
- **Smoke latency (staging):** `GET /healthz` 5.39 ms · `POST /api/visit` 2.55 ms.
- **Zero npm dependencies.** Backend is Node stdlib only.
- **1 drift alert** raised and resolved (A1 FAIL → re-PASS).

## What the test actually exercised in our 50-person firm

| Department / role                | Was it engaged? | Where                                                |
|----------------------------------|-----------------|------------------------------------------------------|
| CEO                              | yes             | Triage assessment in `01-triage.md`                  |
| CTO                              | yes             | Architecture sign-off in `03-spec.md`, A3 gate       |
| Product Owner                    | yes             | Triage + `03-spec.md`                                |
| Project Manager                  | yes             | Synthesized `02-kickoff-meeting.md`                  |
| Account Manager                  | yes             | Drafted `EMAIL-0001.md` (German)                     |
| UX Designer                      | yes             | `04-design.md`, A3 gate, B4 gate                     |
| UI Designer                      | yes             | Design tokens in `04-design.md`                      |
| Brand Guardian                   | yes             | Brand check in `04-design.md`                        |
| Frontend Engineer                | yes             | `hello-card.html`                                    |
| Backend Engineer                 | yes             | `server.js`                                          |
| Database Engineer                | yes (light)     | `counter.json` schema + atomic-write pattern         |
| DevOps Engineer                  | yes             | `Dockerfile`, `nginx.sample.conf`                    |
| SRE                              | yes             | `/healthz` endpoint, smoke-test latency in B1        |
| QA Engineer                      | yes (twice)     | Gate A1 (FAIL → PASS), Gate B1                       |
| Code Reviewer                    | yes             | Gate A3                                              |
| Security Officer                 | yes             | Kickoff + Gate A2                                    |
| Privacy Officer                  | yes             | Kickoff + Gate B2                                    |
| Compliance Auditor               | yes             | Gate B3                                              |
| Mobile Engineer                  | no              | Out of scope for a single HTML widget                |
| Support Engineer                 | no              | Not invoked — no production incident                 |
| Technical Writer                 | yes             | `docs/README.md`                                     |
| Release Manager                  | yes             | Sole writer to `output/03-production/v0.1.0/`        |
| Archivist                        | yes             | Move to `archive/`, `decisions.md`, `retros.md`      |

**21 / 23 subagent roles touched the ticket.** The two unused (mobile-engineer, support-engineer) had no applicable work — by design, not by gap.

## What this proves

1. **The operating loop runs end-to-end** in under 15 minutes for an XS-sized ticket.
2. **Hard Gates actually fail** when they should — coverage gaps were not waved through.
3. **Loop-back at STEP 6 works** when a gate fails — the firm did not skip ahead.
4. **Parallel agent dispatch works** (3 kickoff, 3 Gate A, 4 Gate B = 10 LLM calls in 3 concurrent batches).
5. **Production immutability is enforceable** — `chmod -R a-w` set the bits correctly (caveat documented: running as root in this sandbox bypasses file perms; on a non-root deploy `chattr +i` is the canonical hardening).
6. **Audit trail is complete and machine-readable** — every gate decision is in `logs/gate-decisions.log`, every drift in `logs/drift-alerts.log`, every release manifest holds SHA-256 hashes.

## Caveats and known omissions

- **Browser-level visual checks deferred.** AC-6 (4G timing budget) and AC-13 (true 320 px reflow on a real device) are inferred from CSS, not measured in a headless browser. A future ticket should add a Playwright check to harden B4.
- **Root in sandbox.** As noted in `logs/drift-alerts.log`, the production folder is correctly set to `dr-xr-xr-x` but root still bypasses. Real deploys run as a non-root user.
- **The 50-concurrent test originally failed** because it shared the default 30/min rate limit. Fixed by raising the limit for that specific test — but the bug surfaced legitimately during STEP 6's sanity check, not via a gate.
