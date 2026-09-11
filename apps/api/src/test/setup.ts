import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import pg from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(here, "../..");
const repoRoot = path.resolve(apiRoot, "../..");

config({ path: path.join(repoRoot, ".env") });

process.env.NODE_ENV = "test";
process.env.JWT_SECRET ??= "test-jwt-secret";

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  toTestDatabaseUrl(process.env.DATABASE_URL ?? "");

if (!databaseUrl) {
  throw new Error("DATABASE_URL or TEST_DATABASE_URL is required for tests");
}

process.env.DATABASE_URL = databaseUrl;

await ensureTestDatabase(databaseUrl);

execSync("npx prisma migrate deploy", {
  cwd: apiRoot,
  env: process.env,
  stdio: "inherit",
});

function toTestDatabaseUrl(databaseUrl: string): string {
  if (!databaseUrl) {
    return "";
  }

  const url = new URL(databaseUrl);
  const name = url.pathname.replace(/^\//, "");
  if (!name.endsWith("_test")) {
    url.pathname = `/${name}_test`;
  }
  return url.toString();
}

async function ensureTestDatabase(testUrl: string): Promise<void> {
  const url = new URL(testUrl);
  const testName = url.pathname.replace(/^\//, "");
  url.pathname = "/postgres";

  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();

  try {
    const existing = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [testName],
    );

    if ((existing.rowCount ?? 0) === 0) {
      try {
        await client.query(`CREATE DATABASE "${testName}"`);
      } catch (error) {
        const code =
          error && typeof error === "object" && "code" in error
            ? error.code
            : undefined;
        if (code !== "23505") {
          throw error;
        }
      }
    }
  } finally {
    await client.end();
  }
}
