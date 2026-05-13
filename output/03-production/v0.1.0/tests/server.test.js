// BK One Hello-Card — backend tests (Node built-in test runner)
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const SERVER = path.join(__dirname, "..", "backend", "server.js");

function get(port, p, method = "GET") {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, path: p, method }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

async function startServer(env = {}) {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "hc-"));
  const port = 18000 + Math.floor(Math.random() * 2000);
  const child = spawn("node", [SERVER], {
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port), STATE_FILE: path.join(tmp, "counter.json"), RATE_PER_MIN: "30", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    let ready = false;
    child.stdout.on("data", (b) => { if (b.toString().includes("listening") && !ready) { ready = true; resolve(); } });
    child.stderr.on("data", (b) => { /* surfaced on test failure */ });
    setTimeout(() => ready ? null : reject(new Error("server did not start")), 2000);
  });
  return { port, child, tmp };
}

async function stopServer(ctx) {
  ctx.child.kill("SIGTERM");
  await fs.rm(ctx.tmp, { recursive: true, force: true });
}

test("healthz returns ok and a count", async () => {
  const s = await startServer();
  try {
    const r = await get(s.port, "/healthz");
    assert.equal(r.status, 200);
    const j = JSON.parse(r.body);
    assert.equal(j.status, "ok");
    assert.equal(typeof j.count, "number");
  } finally { await stopServer(s); }
});

test("POST /api/visit increments the counter and persists", async () => {
  const s = await startServer();
  try {
    const before = JSON.parse((await get(s.port, "/api/visit")).body).count;
    await get(s.port, "/api/visit", "POST");
    await get(s.port, "/api/visit", "POST");
    const after = JSON.parse((await get(s.port, "/api/visit")).body).count;
    assert.equal(after - before, 2);
  } finally { await stopServer(s); }
});

test("50 concurrent POSTs produce exactly 50 increments (no lost updates)", async () => {
  // Rate limit raised for this test — concurrency-correctness, not rate-limit behavior.
  const s = await startServer({ RATE_PER_MIN: "1000" });
  try {
    const before = JSON.parse((await get(s.port, "/api/visit")).body).count;
    await Promise.all(Array.from({ length: 50 }, () => get(s.port, "/api/visit", "POST")));
    const after = JSON.parse((await get(s.port, "/api/visit")).body).count;
    assert.equal(after - before, 50);
  } finally { await stopServer(s); }
});

test("security headers present on JSON response", async () => {
  const s = await startServer();
  try {
    const r = await get(s.port, "/api/visit");
    assert.match(r.headers["content-security-policy"] || "", /default-src 'self'/);
    assert.equal(r.headers["x-content-type-options"], "nosniff");
    assert.equal(r.headers["referrer-policy"], "no-referrer");
  } finally { await stopServer(s); }
});

test("rate limit kicks in at the 31st request in the same window", async () => {
  const s = await startServer({ RATE_PER_MIN: "30" });
  try {
    const codes = [];
    for (let i = 0; i < 32; i++) {
      const r = await get(s.port, "/api/visit", "POST");
      codes.push(r.status);
    }
    const ok = codes.filter((c) => c === 200).length;
    const limited = codes.filter((c) => c === 429).length;
    assert.equal(ok, 30);
    assert.ok(limited >= 1, "expected at least one 429");
  } finally { await stopServer(s); }
});

test("404 on unknown route", async () => {
  const s = await startServer();
  try {
    const r = await get(s.port, "/nope");
    assert.equal(r.status, 404);
  } finally { await stopServer(s); }
});

test("counter persists across server restart (AC-7)", async () => {
  const stateDir = await fs.mkdtemp(path.join(os.tmpdir(), "hc-persist-"));
  const stateFile = path.join(stateDir, "counter.json");
  // Round 1: start, increment twice, stop.
  let port = 18000 + Math.floor(Math.random() * 2000);
  let child = spawn("node", [SERVER], {
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port), STATE_FILE: stateFile, RATE_PER_MIN: "1000" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    child.stdout.on("data", (b) => { if (b.toString().includes("listening")) resolve(); });
    setTimeout(() => reject(new Error("no start")), 2000);
  });
  await get(port, "/api/visit", "POST");
  await get(port, "/api/visit", "POST");
  const before = JSON.parse((await get(port, "/api/visit")).body).count;
  child.kill("SIGTERM");
  await new Promise((r) => child.on("exit", r));
  // Round 2: start fresh process on same state file.
  port = 18000 + Math.floor(Math.random() * 2000);
  child = spawn("node", [SERVER], {
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port), STATE_FILE: stateFile, RATE_PER_MIN: "1000" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    child.stdout.on("data", (b) => { if (b.toString().includes("listening")) resolve(); });
    setTimeout(() => reject(new Error("no restart")), 2000);
  });
  try {
    const after = JSON.parse((await get(port, "/api/visit")).body).count;
    assert.equal(after, before, "counter must survive process restart");
  } finally {
    child.kill("SIGTERM");
    await fs.rm(stateDir, { recursive: true, force: true });
  }
});

test("no Set-Cookie header on any response (AC-10)", async () => {
  const s = await startServer();
  try {
    for (const route of ["/", "/healthz", "/api/visit"]) {
      const r = await get(s.port, route, route === "/api/visit" ? "POST" : "GET");
      assert.equal(r.headers["set-cookie"], undefined, `Set-Cookie must not be present on ${route}`);
    }
  } finally { await stopServer(s); }
});

test("body > 1 KB on POST is rejected (DoS guard)", async () => {
  const s = await startServer({ RATE_PER_MIN: "1000" });
  try {
    const big = "x".repeat(2048);
    const result = await new Promise((resolve) => {
      const req = http.request({ host: "127.0.0.1", port: s.port, path: "/api/visit", method: "POST",
        headers: { "Content-Type": "application/octet-stream", "Content-Length": Buffer.byteLength(big) } }, (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      });
      req.on("error", () => resolve({ status: 0, body: "" })); // socket killed by server
      req.write(big);
      req.end();
    });
    // Either the server aborts the socket (status 0) or responds non-200.
    assert.ok(result.status === 0 || result.status >= 400, `expected abort or 4xx/5xx, got ${result.status}`);
  } finally { await stopServer(s); }
});

test("frontend escapes name into textContent (AC-2/3/4/5 — static analysis)", async () => {
  const html = await fs.readFile(path.join(__dirname, "..", "frontend", "hello-card.html"), "utf8");
  // AC-4: must use textContent, never innerHTML for the name path.
  assert.match(html, /h1\.textContent\s*=/, "h1 must be set via textContent");
  assert.doesNotMatch(html, /h1\.innerHTML\s*=/, "h1 must NOT use innerHTML");
  // AC-3: default 'Willkommen' present.
  assert.match(html, /Willkommen/, "default greeting must be present");
  // AC-5: 64-char cap + allowlist regex.
  assert.match(html, /NAME_MAX\s*=\s*64/, "64-char cap must be present");
  assert.match(html, /NAME_ALLOWED\s*=\s*\/\[/, "allowlist regex must be present");
  // AC-1: no external network requests (no http(s):// in script).
  assert.doesNotMatch(html, /<script[^>]+src=["']https?:/, "no external scripts");
  assert.doesNotMatch(html, /<link[^>]+href=["']https?:/, "no external stylesheets");
});
