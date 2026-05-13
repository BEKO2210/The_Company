// BK One — Hello-Card backend
// Stdlib-only Node 18+. No dependencies.
// Endpoints: POST /api/visit, GET /api/visit, GET /healthz, static /hello-card.html
"use strict";

const http = require("node:http");
const fs   = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT          = Number(process.env.PORT || 8080);
const HOST          = process.env.HOST || "127.0.0.1";
const STATE_FILE    = process.env.STATE_FILE || path.join(__dirname, "counter.json");
const STATIC_DIR    = process.env.STATIC_DIR || path.join(__dirname, "..", "frontend");
const ALLOW_ORIGIN  = process.env.ALLOW_ORIGIN || ""; // empty = same-origin only
const RATE_PER_MIN  = Number(process.env.RATE_PER_MIN || 30);
const MAX_BODY      = 1024; // 1 KB

const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "interest-cohort=(), browsing-topics=()",
};

// In-memory counter, persisted via atomic file write.
let counter = 0;
let writeLock = Promise.resolve();
const DAILY_SALT = crypto.randomBytes(16).toString("hex");
const buckets = new Map(); // hash -> { tokens, ts }

async function loadCounter() {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf8");
    const obj = JSON.parse(raw);
    if (typeof obj.count === "number" && Number.isFinite(obj.count)) counter = obj.count;
  } catch (e) {
    if (e.code !== "ENOENT") console.error("[counter] load failed, starting at 0:", e.message);
    counter = 0;
  }
}

async function persistCounter() {
  const tmp = STATE_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify({ count: counter }), "utf8");
  await fs.rename(tmp, STATE_FILE);
}

function clientHash(req) {
  // Token-bucket key: hash(IP + daily salt). IP is never stored.
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  return crypto.createHash("sha256").update(ip + ":" + DAILY_SALT).digest("hex");
}

function allow(req) {
  const key = clientHash(req);
  const now = Date.now();
  const windowMs = 60_000;
  const b = buckets.get(key) || { tokens: RATE_PER_MIN, ts: now };
  // refill
  const elapsed = now - b.ts;
  if (elapsed > windowMs) { b.tokens = RATE_PER_MIN; b.ts = now; }
  if (b.tokens <= 0) { buckets.set(key, b); return false; }
  b.tokens -= 1;
  buckets.set(key, b);
  // janitor
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (now - v.ts > windowMs) buckets.delete(k);
  }
  return true;
}

function writeHeaders(res, status, extra = {}) {
  const headers = Object.assign({}, SECURITY_HEADERS, extra);
  if (ALLOW_ORIGIN) headers["Access-Control-Allow-Origin"] = ALLOW_ORIGIN;
  res.writeHead(status, headers);
}

function json(res, status, body) {
  writeHeaders(res, status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function serveStatic(req, res) {
  // Only serve hello-card.html from STATIC_DIR. No directory traversal.
  if (req.url !== "/" && req.url !== "/hello-card.html") return false;
  try {
    const file = await fs.readFile(path.join(STATIC_DIR, "hello-card.html"));
    writeHeaders(res, 200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(file);
    return true;
  } catch { return false; }
}

async function handle(req, res) {
  if (req.method === "GET" && (req.url === "/" || req.url === "/hello-card.html")) {
    const ok = await serveStatic(req, res);
    if (!ok) json(res, 500, { error: "static unavailable" });
    return;
  }
  if (req.method === "GET" && req.url === "/healthz") {
    return json(res, 200, { status: "ok", count: counter });
  }
  if (req.method === "GET" && req.url === "/api/visit") {
    return json(res, 200, { count: counter });
  }
  if (req.method === "POST" && req.url === "/api/visit") {
    if (!allow(req)) return json(res, 429, { error: "rate_limited" });
    // Drain (and cap) body — we don't read it, but must not let it grow unbounded.
    let read = 0; let aborted = false;
    req.on("data", (chunk) => { read += chunk.length; if (read > MAX_BODY) { aborted = true; req.destroy(); } });
    req.on("end", async () => {
      if (aborted) return;
      try {
        writeLock = writeLock.then(async () => {
          counter += 1;
          await persistCounter();
        });
        await writeLock;
        json(res, 200, { count: counter });
      } catch (e) {
        console.error("[visit] persist failed:", e.message);
        json(res, 503, { error: "persist_failed" });
      }
    });
    return;
  }
  json(res, 404, { error: "not_found" });
}

(async () => {
  await loadCounter();
  http.createServer(handle).listen(PORT, HOST, () => {
    console.log(`[hello-card] listening on http://${HOST}:${PORT} (state=${STATE_FILE})`);
  });
})();
