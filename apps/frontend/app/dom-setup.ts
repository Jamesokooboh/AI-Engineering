import { JSDOM } from "jsdom";

// Must be the first import in any test file that renders React components -
// @testing-library/react needs `document`/`window` to exist before it's
// imported. Node's test runner has no DOM by default.
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Node: dom.window.Node,
});

// Node 24 already defines a read-only `navigator` global - Object.assign
// can't overwrite it, so this needs defineProperty instead.
Object.defineProperty(globalThis, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
