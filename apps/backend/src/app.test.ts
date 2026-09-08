import { test, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "./app";
import { prisma } from "./lib/prisma";

beforeEach(async () => {
  await prisma.mentor.deleteMany();
});

after(async () => {
  await prisma.mentor.deleteMany();
  await prisma.$disconnect();
});

test("GET /health returns ok", async () => {
  const res = await request(app).get("/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: "ok" });
});

test("GET /mentors returns mentors from the database", async () => {
  await prisma.mentor.create({ data: { name: "Ada", bio: "Backend mentor" } });

  const res = await request(app).get("/mentors");

  assert.equal(res.status, 200);
  assert.equal(res.body.mentors.length, 1);
  assert.equal(res.body.mentors[0].name, "Ada");
});

test("POST /mentors creates a mentor and persists it", async () => {
  const res = await request(app)
    .post("/mentors")
    .send({ name: "Grace", bio: "Systems mentor" });

  assert.equal(res.status, 201);
  assert.equal(res.body.mentor.name, "Grace");

  const stored = await prisma.mentor.findUnique({ where: { id: res.body.mentor.id } });
  assert.equal(stored?.bio, "Systems mentor");
});

test("POST /mentors rejects a missing name", async () => {
  const res = await request(app).post("/mentors").send({ bio: "no name given" });

  assert.equal(res.status, 400);
  assert.match(res.body.error, /name is required/);
});

test("POST /mentors rejects a missing bio", async () => {
  const res = await request(app).post("/mentors").send({ name: "No Bio" });

  assert.equal(res.status, 400);
  assert.match(res.body.error, /bio is required/);
});

test("POST /mentors with malformed JSON returns 400, not 500", async () => {
  const res = await request(app)
    .post("/mentors")
    .set("Content-Type", "application/json")
    .send("{not valid json");

  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Malformed request body");
});
