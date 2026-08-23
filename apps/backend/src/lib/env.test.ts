import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDatabaseUrl, parsePort, ConfigError } from "./env";

test("parseDatabaseUrl falls back to the documented default when unset", () => {
  const url = parseDatabaseUrl(undefined);
  assert.equal(url, "postgresql://user:password@localhost:5432/ai_mentor?schema=public");
});

test("parseDatabaseUrl accepts a valid postgresql:// url", () => {
  const url = parseDatabaseUrl("postgresql://a:b@host:5432/db");
  assert.equal(url, "postgresql://a:b@host:5432/db");
});

test("parseDatabaseUrl rejects a value with the wrong scheme", () => {
  assert.throws(() => parseDatabaseUrl("mysql://a:b@host:3306/db"), ConfigError);
});

test("parseDatabaseUrl rejects a bare scheme with no hostname", () => {
  assert.throws(() => parseDatabaseUrl("postgresql://"), ConfigError);
});

test("parseDatabaseUrl rejects a malformed value", () => {
  assert.throws(() => parseDatabaseUrl("not a url"), ConfigError);
});

test("parsePort falls back to 4000 when unset", () => {
  assert.equal(parsePort(undefined), 4000);
});

test("parsePort accepts a valid port", () => {
  assert.equal(parsePort("5555"), 5555);
});

test("parsePort rejects a non-numeric value", () => {
  assert.throws(() => parsePort("abc"), ConfigError);
});

test("parsePort rejects a value outside the valid range", () => {
  assert.throws(() => parsePort("99999"), ConfigError);
});
