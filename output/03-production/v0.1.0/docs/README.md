# Hello-Card — BK One v0.1.0

Eine kleine HTML-Karte mit anonymem Besuchszähler. DSGVO-konform, ohne Cookies, selbst hostbar.

## Inhalt

```
frontend/hello-card.html      Die Karte (static asset)
backend/server.js             Node-Server (stdlib only)
backend/package.json          Start-/Test-Skripte
devops/Dockerfile             Container-Bauplan
devops/nginx.sample.conf      Reverse-Proxy ohne Access-Log
tests/server.test.js          Tests (node:test)
```

## Schnellstart (lokal)

```bash
cd backend
node server.js
# öffnet auf http://127.0.0.1:8080/
```

Aufruf im Browser: `http://127.0.0.1:8080/hello-card.html?name=Belkis`

## Schnellstart (Docker)

```bash
docker build -t hello-card -f devops/Dockerfile .
docker run -p 8080:8080 -v hello-card-state:/app/state hello-card
```

## Tests

```bash
cd backend
npm test
```

## Konfiguration (Umgebungsvariablen)

| Variable        | Default                 | Bedeutung                                              |
|-----------------|-------------------------|--------------------------------------------------------|
| `HOST`          | `127.0.0.1`             | Bind-Adresse                                           |
| `PORT`          | `8080`                  | Bind-Port                                              |
| `STATE_FILE`    | `backend/counter.json`  | Pfad zur Zähler-Datei                                  |
| `STATIC_DIR`    | `frontend/`             | Wo `hello-card.html` liegt                             |
| `ALLOW_ORIGIN`  | *(leer = same-origin)*  | CORS-Allow-Liste                                       |
| `RATE_PER_MIN`  | `30`                    | Maximale POSTs/Minute pro Quelle (IP-frei gehasht)     |

## Endpunkte

| Methode | Pfad             | Antwort                                  |
|---------|------------------|------------------------------------------|
| GET     | `/`              | Liefert `hello-card.html`                |
| GET     | `/hello-card.html` | Dasselbe                                |
| GET     | `/api/visit`     | `{ "count": <int> }` (read-only)         |
| POST    | `/api/visit`     | inkrementiert + `{ "count": <int> }`     |
| GET     | `/healthz`       | `{ "status": "ok", "count": <int> }`     |

## Einbinden auf der eigenen Seite

```html
<iframe
  src="https://your-domain.example/hello-card.html?name=Belkis"
  style="border:0;width:100%;max-width:520px;height:240px"
  loading="lazy"
  referrerpolicy="no-referrer"
  title="Hello-Card"
></iframe>
```

## Datenschutz (DSGVO)

- Keine Cookies, kein `localStorage`, kein `sessionStorage`, kein Fingerprinting.
- Der `?name=`-Parameter bleibt im Browser und wird nicht an das Backend gesendet.
- Das Backend speichert ausschließlich eine ganze Zahl — keine IPs, keine Zeitstempel, kein User-Agent.
- Der Rate-Limit-Hash wird nur im Arbeitsspeicher gehalten und verfällt nach 60 s.
- **Wichtig:** Schalten Sie auf Ihrem Reverse-Proxy das Access-Log aus (siehe `devops/nginx.sample.conf`).
  Falls Sie Logs behalten möchten, stripen Sie IPs und rotieren Sie spätestens nach 7 Tagen.

## Bekannte Grenzen

- Ein globaler Zähler (kein Per-Host-Namespacing). Für v0.2.0 vorgesehen.
- Rate-Limit-Bucket lebt nur im Prozess-RAM und überlebt keinen Neustart.
- Snippet-Embed (`<script src>`-Integration) folgt in v0.2.0.

## Lizenz

Auftragswerk für Belkis Aslani. Quellcode-Lizenz: MIT (anpassbar).
