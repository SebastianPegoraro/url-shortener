/**
 * Runs once before all integration tests to set up the test database.
 */

import { execSync } from "node:child_process";
import path from "node:path";
import { cpus } from "node:os";

/**
 * Generate unique database paths for each Jest worker to enable parallel test execution.
 * When running in multiple workers, each gets its own test_N.db file.
 */
function getTestDbPaths() {
  // When running integration tests, Jest uses a pool of workers.
  // We need to set up databases for all potential workers.
  let numWorkers;
  if (process.env.JEST_WORKER_ID) {
    numWorkers = 1;
  } else if (process.env.JEST_MAX_WORKERS) {
    numWorkers = Number.parseInt(process.env.JEST_MAX_WORKERS);
  } else {
    numWorkers = cpus().length;
  }
  const paths = [];

  // Add the shared database path (for single-threaded mode)
  paths.push(path.resolve(process.cwd(), "prisma/test_shared.db"));

  // Add worker-specific database paths
  for (let i = 1; i <= numWorkers; i++) {
    paths.push(path.resolve(process.cwd(), `prisma/test_${i}.db`));
  }

  return paths;
}

/**
 * Prepare the integration test database by setting `DATABASE_URL` to the test DB file and applying Prisma migrations.
 *
 * @throws An error if applying Prisma migrations fails.
 */
export default async function globalSetup() {
  const testDbPaths = getTestDbPaths();

  try {
    // Generate Prisma client for the dev schema first
    // This ensures @prisma/client is initialized for the dev schema before tests import it
    execSync("npx prisma generate --schema=prisma/schema.dev.prisma", {
      stdio: "pipe",
    });

    // Apply migrations to each test database (shared + per-worker)
    for (const dbPath of testDbPaths) {
      execSync("npx prisma migrate deploy --schema=prisma/schema.dev.prisma", {
        env: {
          ...process.env,
          DATABASE_URL: `file:${dbPath}`,
        },
        stdio: "pipe",
      });
    }
    console.log(
      `✓ Test database migrations applied to ${testDbPaths.length} database(s)`,
    );
  } catch (error) {
    console.error("Failed to apply migrations:", error);
    throw error;
  }
}
