/**
 * Runs once after all integration tests to clean up the test database.
 */

import { PrismaClient } from "@prisma/client";
import path from "node:path";
import fs from "node:fs";
import { cpus } from "node:os";

/**
 * Generate unique database paths for each Jest worker to clean up after testing.
 */
function getTestDbPaths() {
  let numWorkers;
  if (process.env.JEST_WORKER_ID) {
    numWorkers = 1;
  } else if (process.env.JEST_MAX_WORKERS) {
    numWorkers = Number.parseInt(process.env.JEST_MAX_WORKERS);
  } else {
    numWorkers = cpus().length;
  }
  const paths = [];

  paths.push(path.resolve(process.cwd(), "prisma/test_shared.db"));

  for (let i = 1; i <= numWorkers; i++) {
    paths.push(path.resolve(process.cwd(), `prisma/test_${i}.db`));
  }

  return paths;
}

/**
 * Removes all records from the test SQLite database's `url` table and ensures the Prisma client is disconnected; logs success or any error.
 */
export default async function globalTeardown() {
  const testDbPaths = getTestDbPaths();

  try {
    // Clean up data in each test database and remove the files
    for (const dbPath of testDbPaths) {
      const prisma = new PrismaClient({
        datasources: {
          db: { url: `file:${dbPath}` },
        },
      });

      try {
        await prisma.url.deleteMany();
      } finally {
        await prisma.$disconnect();
      }

      // Remove the database file to clean up
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
      }
    }
    console.log(
      `✓ Test database(s) cleaned up (${testDbPaths.length} file(s))`,
    );
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}
