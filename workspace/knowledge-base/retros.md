# Retrospectives

> One paragraph per completed ticket, appended by the Archivist at STEP 11.
> Format: TCK-YYYYMMDD-#### · what went well · what didn't · what to change.

---

**TCK-20260513-0001 · Hello-Card v0.1.0** — Went well: kickoff with three parallel leads (frontend, backend, security+privacy joint) converged in one round; spec captured all kickoff blockers; B-gates all PASSed first try. Didn't go well: A1 (QA) failed first iteration because the suite shipped before the spec acceptance criteria were fully mapped to tests — coverage gaps on AC-2/3/4/5/7/10 plus body-cap and lint. Loop-back added 5 tests + an ESLint config and re-PASSed cleanly. To change: at the end of STEP 6, the frontend and backend engineers should self-audit against the spec's AC matrix before handing off to gates. Cost: one loop-back iteration.
