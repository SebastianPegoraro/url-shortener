/**
 * globalSetup.integration.ts
 *
 * Runs once before all integration tests to set up the test database.
 */

import { execSync } from "node:child_process";
import path from "node:path";

const TEST_DB_PATH = path.resolve(process.cwd(), "prisma/test.db");

export default async function globalSetup() {
  // Set environment for migrations
  process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

  try {
    // Run migrations to set up the test database schema
    execSync("npx prisma migrate deploy --schema=prisma/schema.dev.prisma", {
      env: {
        ...process.env,
        DATABASE_URL: `file:${TEST_DB_PATH}`,
      },
      stdio: "pipe",
    });
    console.log("✓ Test database migrations applied");
  } catch (error) {
    console.error("Failed to apply migrations:", error);
    throw error;
  }
}
