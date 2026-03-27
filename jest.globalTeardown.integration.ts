/**
 * globalTeardown.integration.ts
 *
 * Runs once after all integration tests to clean up the test database.
 */

import { PrismaClient } from "@prisma/client";
import path from "node:path";

const TEST_DB_PATH = path.resolve(process.cwd(), "prisma/test.db");

/**
 * Removes all records from the test SQLite database's `url` table and ensures the Prisma client is disconnected; logs success or any error.
 */
export default async function globalTeardown() {
  const prisma = new PrismaClient({
    datasources: {
      db: { url: `file:${TEST_DB_PATH}` },
    },
  });

  try {
    // Clean up all data
    await prisma.url.deleteMany();
    await prisma.$disconnect();
    console.log("✓ Test database cleaned up");
  } catch (error) {
    console.error("Cleanup error:", error);
    await prisma.$disconnect();
  }
}
