import path from "node:path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../../.env") });

export class ConfigError extends Error {}

const DEFAULT_DATABASE_URL = "postgresql://user:password@localhost:5432/ai_mentor?schema=public";
const DEFAULT_PORT = 4000;

export function parseDatabaseUrl(value: string | undefined): string {
  const url = value ?? DEFAULT_DATABASE_URL;
  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new ConfigError(`DATABASE_URL must be a postgresql:// connection string — got "${url}"`);
  }
  return url;
}

export function parsePort(value: string | undefined): number {
  if (!value) return DEFAULT_PORT;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigError(`PORT must be a valid port number (1-65535) — got "${value}"`);
  }
  return port;
}

function loadEnv() {
  try {
    return {
      databaseUrl: parseDatabaseUrl(process.env.DATABASE_URL),
      port: parsePort(process.env.PORT),
    };
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(err.message);
      process.exit(1);
    }
    throw err;
  }
}

export const env = loadEnv();
