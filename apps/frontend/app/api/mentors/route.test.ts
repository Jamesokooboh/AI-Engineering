import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";

let fakeBackend: http.Server;
let behavior: "success" | "upstream-error" = "success";
let backendPort: number;

function handler(req: http.IncomingMessage, res: http.ServerResponse) {
  if (behavior === "upstream-error") {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "boom" }));
    return;
  }
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ mentors: [{ id: "1", name: "Ada", bio: "Backend mentor" }] }));
    } else {
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ mentor: { id: "2", ...JSON.parse(body) } }));
    }
  });
}

// BACKEND_URL is fixed for the whole file - env.ts reads it once at import
// time (via a static import inside route.ts, not the cache-busted one
// below), so changing it mid-run wouldn't take effect. To simulate the
// backend being down, close and reopen this same server instead.
before(async () => {
  fakeBackend = http.createServer(handler);
  await new Promise<void>((resolve) => fakeBackend.listen(0, resolve));
  backendPort = (fakeBackend.address() as AddressInfo).port;
  process.env.BACKEND_URL = `http://localhost:${backendPort}`;
});

after(() => {
  fakeBackend.close();
});

function importRoute() {
  return import(`./route?t=${Date.now()}-${Math.random()}`);
}

test("GET /api/mentors proxies a successful backend response", async () => {
  behavior = "success";
  const { GET } = await importRoute();
  const res = await GET();
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.mentors[0].name, "Ada");
});

test("POST /api/mentors proxies a successful create", async () => {
  behavior = "success";
  const { POST } = await importRoute();
  const req = new Request("http://localhost/api/mentors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Grace", bio: "Systems mentor" }),
  });
  const res = await POST(req);
  const data = await res.json();
  assert.equal(res.status, 201);
  assert.equal(data.mentor.name, "Grace");
});

test("GET /api/mentors forwards the backend's actual error, not an unreachable message", async () => {
  behavior = "upstream-error";
  const { GET } = await importRoute();
  const res = await GET();
  const data = await res.json();
  // The backend answered (with a 500) - it's running. Forwarding its own
  // error is the honest response, not claiming it's unreachable.
  assert.equal(res.status, 500);
  assert.equal(data.error, "boom");
  behavior = "success";
});

test("GET /api/mentors returns 502 with the unreachable message when the backend never answers", async () => {
  await new Promise<void>((resolve) => fakeBackend.close(() => resolve()));
  const { GET } = await importRoute();
  const res = await GET();
  const data = await res.json();
  assert.equal(res.status, 502);
  assert.match(data.error, /Couldn't reach the server/);

  fakeBackend = http.createServer(handler);
  await new Promise<void>((resolve) => fakeBackend.listen(backendPort, resolve));
});

test("POST /api/mentors returns 400 for a malformed body without contacting the backend", async () => {
  const { POST } = await importRoute();
  const req = new Request("http://localhost/api/mentors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{not valid json",
  });
  const res = await POST(req);
  const data = await res.json();
  assert.equal(res.status, 400);
  assert.equal(data.error, "Malformed request body");
});
