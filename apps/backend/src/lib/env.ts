import "dotenv/config";

function required(name: string, hint: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is required — expected ${hint}`);
    process.exit(1);
  }
  return value;
}

function optionalPort(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(`${name} must be a valid port number (1-65535) — got "${raw}"`);
    process.exit(1);
  }
  return port;
}

export const env = {
  databaseUrl: required("DATABASE_URL", "a postgresql:// connection string"),
  port: optionalPort("PORT", 4000),
};
