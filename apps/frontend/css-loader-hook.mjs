// Outside Next's bundler, CSS Modules imports are just files full of CSS
// syntax that Node can't parse as JavaScript. Stub them to an object where
// every property returns its own name - good enough for tests that check
// rendered text/roles, not class names.
export async function load(url, context, nextLoad) {
  if (url.endsWith(".css")) {
    return {
      format: "module",
      source: "export default new Proxy({}, { get: (_, prop) => prop });",
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
