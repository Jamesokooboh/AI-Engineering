import "./dom-setup";
import React from "react";
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import Home from "./page";

function mockFetch(impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  globalThis.fetch = impl as typeof fetch;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  cleanup();
});

test("shows 'No mentors yet' when the proxy returns an empty list", async () => {
  mockFetch(async () => jsonResponse({ mentors: [] }));
  render(<Home />);
  await waitFor(() => screen.getByText("No mentors yet"));
});

test("shows mentors returned by the proxy", async () => {
  mockFetch(async () =>
    jsonResponse({ mentors: [{ id: "1", name: "Ada", bio: "Backend mentor" }] }),
  );
  render(<Home />);
  await waitFor(() => screen.getByText(/Ada/));
});

test("shows the proxy's error message when the fetch fails", async () => {
  mockFetch(async () =>
    jsonResponse({ error: "Couldn't reach the server — is the backend running?" }, 502),
  );
  render(<Home />);
  const alert = await waitFor(() => screen.getByRole("alert"));
  assert.match(alert.textContent ?? "", /Couldn't reach the server/);
});

test("appends a new mentor to the list immediately after a successful add, without refetching", async () => {
  let getCalls = 0;
  mockFetch(async (_input, init) => {
    const method = init?.method ?? "GET";
    if (method === "GET") {
      getCalls++;
      return jsonResponse({ mentors: [] });
    }
    return jsonResponse({ mentor: { id: "2", name: "Grace", bio: "Systems mentor" } }, 201);
  });

  render(<Home />);
  await waitFor(() => screen.getByText("No mentors yet"));

  fireEvent.change(screen.getByPlaceholderText("Name"), { target: { value: "Grace" } });
  fireEvent.change(screen.getByPlaceholderText("Bio"), { target: { value: "Systems mentor" } });
  fireEvent.click(screen.getByRole("button", { name: "Add mentor" }));

  await waitFor(() => screen.getByText(/Grace/));
  assert.equal(getCalls, 1, "the list should update from the POST response, not a refetch");
});
