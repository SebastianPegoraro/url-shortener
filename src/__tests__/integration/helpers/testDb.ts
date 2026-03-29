/**
 * Sets up an isolated SQLite database for integration tests.
 *
 * How it works:
 * - Points DATABASE_URL to a separate test.db file so integration tests
 *   never touch your dev.db.
 * - Exports a `cleanDb` helper to wipe all rows between tests, keeping
 *   tests independent without rebuilding the schema each time.
 * - Exports the `prisma` client that every test file should import from
 *   here (not from @/lib/prisma) so they all share the same connection
 *   pointed at the test database.
 *
 * Usage in jest.config.js:
 *   globalSetup: './src/__tests__/integration/helpers/globalSetup.ts'
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import path from "node:path";

/**
 * Use a unique test database file per Jest worker to enable parallel test execution.
 * JEST_WORKER_ID is undefined when running in single-threaded mode (e.g., debugging).
 * Falls back to 'shared' for backward compatibility in that case.
 */
function getTestDbPath() {
  const workerId = process.env.JEST_WORKER_ID || "shared";
  return path.resolve(process.cwd(), `prisma/test_${workerId}.db`);
}

const TEST_DB_PATH = getTestDbPath();
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

// Create a single shared Prisma client for all integration tests
export const prisma = new PrismaClient({
  datasources: {
    db: { url: `file:${TEST_DB_PATH}` },
  },
});

/**
 * Run once before the entire integration test suite.
 * Applies all migrations to the test database so the schema is ready.
 */
export function setupTestDb() {
  // Load prisma package.json to find the CLI entry point securely
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const prismaPackageJson = require("prisma/package.json");
  const prismaDir = path.dirname(require.resolve("prisma/package.json"));
  const prismaBinRelative = prismaPackageJson.bin.prisma as string;
  const prismaBin = path.join(prismaDir, prismaBinRelative);

  execSync(
    `node "${prismaBin}" migrate deploy --schema=prisma/schema.dev.prisma`,
    {
      env: {
        ...process.env,
        DATABASE_URL: `file:${TEST_DB_PATH}`,
      },
      stdio: "pipe", // suppress noisy output during tests
    },
  );
}

/**
 * Remove all rows from tables used by integration tests to reset test state.
 *
 * This function deletes rows from the `url` table and is intended to be called before each test.
 */
export async function cleanDb() {
  await prisma.url.deleteMany();
}

/**
 * Disconnect Prisma after the suite finishes.
 */
export async function disconnectDb() {
  await prisma.$disconnect();
}
