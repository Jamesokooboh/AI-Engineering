const DEFAULT_BACKEND_URL = "http://localhost:4000";

export class ConfigError extends Error {}

export function parseBackendUrl(value: string | undefined): string {
  const url = value ?? DEFAULT_BACKEND_URL;
  try {
    new URL(url);
  } catch {
    throw new ConfigError(`BACKEND_URL must be a valid URL — got "${url}"`);
  }
  return url;
}

function loadEnv() {
  try {
    return { backendUrl: parseBackendUrl(process.env.BACKEND_URL) };
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}

export const env = loadEnv();
