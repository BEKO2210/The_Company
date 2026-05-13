---
ticket: TCK-20260513-0001
from: account-manager@bk-one.internal
to: belkis.aslani@gmail.com
type: delivery
priority: normal
awaiting_reply: false
created: 2026-05-13T00:26:00Z
---

Betreff: [TCK-20260513-0001] Lieferung Hello-Card v0.1.0

Sehr geehrter Herr Aslani,

die Hello-Card aus Ihrem Auftrag vom 13. Mai ist fertig. Sie liegt unter
`output/03-production/v0.1.0/` und ist gegen weitere Änderungen versiegelt.

**Was Sie bekommen**

- `frontend/hello-card.html` — die fertige Karte zum Hochladen auf jeden Webserver.
- `backend/server.js` — winziger Node-Server (Stdlib-only, keine Abhängigkeiten) für den anonymen Zähler.
- `backend/package.json` und `backend/.eslintrc.json` — Start-/Test-/Lint-Konfiguration.
- `devops/Dockerfile` — fertiges Container-Bauplan.
- `devops/nginx.sample.conf` — Reverse-Proxy ohne Access-Log (DSGVO-konform).
- `tests/server.test.js` — Test-Suite (10 Tests).
- `docs/README.md` — Schnellstart, Konfiguration, Endpunkte, Einbetten, Datenschutz.

**Wichtige Eigenschaften**

- Keine Cookies, kein `localStorage`, kein Tracking. Der Name aus `?name=` bleibt im Browser.
- Server speichert nur einen Zähler (eine Ganzzahl) — keine IPs, keine Zeitstempel, kein User-Agent.
- Dark/Light-Mode automatisch per System-Setting; mobile-first, WCAG 2.2 AA verifiziert.

**Wie Sie selbst hosten**

```
cd backend
node server.js
# danach http://127.0.0.1:8080/hello-card.html?name=IhrName aufrufen
```

Oder per Docker (`docker build -f devops/Dockerfile -t hello-card .`). Details im README.

**Qualitätsspur**

Sieben Gates wurden durchlaufen (QA, Security, Quality, Regression, Datenschutz,
Compliance, UX-Abnahme). Das QA-Gate hat im ersten Durchlauf Lücken in der
Testabdeckung gemeldet — diese wurden geschlossen, anschließend lief das Gate
sauber durch. Vollständige Audit-Spur unter `workspace/tickets/TCK-20260513-0001/`.

**Bekannte Grenzen**

- Ein globaler Zähler (kein Per-Host-Namespacing). Per-Host folgt in v0.2.0 bei Bedarf.
- Rate-Limit-Speicher lebt nur im Prozess (überlebt keinen Neustart).
- Snippet-Embed (`<script src>`) folgt in v0.2.0.

Bei Rückfragen oder Wünschen für v0.2.0 schreiben Sie einfach in den `inbox/`-Ordner.

Mit freundlichen Grüßen
Account Manager
BK One
