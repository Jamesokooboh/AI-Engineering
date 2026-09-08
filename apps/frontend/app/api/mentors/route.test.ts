import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";

let fakeBackend: http.Server;
let behavior: "success" | "upstream-error" = "success";
let backendPort: number;

// env.ts reads process.env.BACKEND_URL once at import time, so each test
// needs a fresh module instance to pick up whatever URL it just set.
function importRoute() {
  return import(`./route?t=${Date.now()}-${Math.random()}`);
}

before(async () => {
  fakeBackend = http.createServer((req, res) => {
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
  });
  await new Promise<void>((resolve) => fakeBackend.listen(0, resolve));
  backendPort = (fakeBackend.address() as AddressInfo).port;
});

after(() => {
  fakeBackend.close();
});

test("GET /api/mentors proxies a successful backend response", async () => {
  behavior = "success";
  process.env.BACKEND_URL = `http://localhost:${backendPort}`;
  const { GET } = await importRoute();
  const res = await GET();
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.mentors[0].name, "Ada");
});

test("POST /api/mentors proxies a successful create", async () => {
  behavior = "success";
  process.env.BACKEND_URL = `http://localhost:${backendPort}`;
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

test("GET /api/mentors returns 502 with the unreachable message when the backend errors", async () => {
  behavior = "upstream-error";
  process.env.BACKEND_URL = `http://localhost:${backendPort}`;
  const { GET } = await importRoute();
  const res = await GET();
  const data = await res.json();
  assert.equal(res.status, 502);
  assert.match(data.error, /Couldn't reach the server/);
});

test("GET /api/mentors returns 502 when the backend is unreachable entirely", async () => {
  process.env.BACKEND_URL = "http://localhost:1";
  const { GET } = await importRoute();
  const res = await GET();
  const data = await res.json();
  assert.equal(res.status, 502);
  assert.match(data.error, /Couldn't reach the server/);
});
