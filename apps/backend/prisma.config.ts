import { defineConfig } from "prisma/config";
import { env } from "./src/lib/env";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env.databaseUrl,
  },
});
