import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "./app";
import { prisma } from "./lib/prisma";

test("GET /health returns ok", async () => {
  const res = await request(app).get("/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: "ok" });
});

test("GET /mentors returns mentors from the database", async () => {
  await prisma.mentor.deleteMany();
  await prisma.mentor.create({ data: { name: "Ada", bio: "Backend mentor" } });

  const res = await request(app).get("/mentors");

  assert.equal(res.status, 200);
  assert.equal(res.body.mentors.length, 1);
  assert.equal(res.body.mentors[0].name, "Ada");

  await prisma.mentor.deleteMany();
});
