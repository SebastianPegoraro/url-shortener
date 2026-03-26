/**
 * Integration tests for GET /api/urls
 *
 * Strategy:
 * - Seed rows directly via Prisma (bypasses the API, so failures here
 *   are clearly in the GET handler, not the POST handler).
 * - Call the real GET handler and assert both the response shape and
 *   that the data matches what was seeded.
 */

import { GET } from "@/app/api/urls/route";
import { prisma, setupTestDb, cleanDb, disconnectDb } from "./helpers/testDb";

beforeAll(async () => {
  setupTestDb();
  await cleanDb();
});

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await disconnectDb();
});

async function seedUrl(
  originalUrl: string,
  shortCode: string,
  clicks = 0,
  createdAt?: Date,
) {
  return prisma.url.create({
    data: { originalUrl, shortCode, clicks, ...(createdAt && { createdAt }) },
  });
}

function fetchUrls() {
  return GET();
}

describe("GET /api/urls — integration", () => {
  describe("empty database", () => {
    it("returns 200 with an empty array", async () => {
      const res = await fetchUrls();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual([]);
    });
  });

  describe("with seeded data", () => {
    it("returns the seeded URLs with correct shape including shortUrl", async () => {
      await seedUrl("https://example.com", "abc123");

      const res = await fetchUrls();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({
        originalUrl: "https://example.com",
        shortCode: "abc123",
        shortUrl: "http://localhost:3000/abc123",
        clicks: 0,
      });
    });

    it("returns up to 10 URLs (enforces the limit)", async () => {
      // Seed 12 records
      for (let i = 1; i <= 12; i++) {
        await seedUrl(
          `https://example${i}.com`,
          `code${i.toString().padStart(2, "0")}`,
        );
      }

      const res = await fetchUrls();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toHaveLength(10);
    });

    it("returns URLs ordered by createdAt descending (newest first)", async () => {
      // Seed with explicit timestamps to control order
      const older = new Date("2024-01-01T00:00:00Z");
      const newer = new Date("2024-06-01T00:00:00Z");

      await seedUrl("https://old.com", "oldone", 0, older);
      await seedUrl("https://new.com", "newone", 0, newer);

      const res = await fetchUrls();
      const body = await res.json();

      expect(body[0].shortCode).toBe("newone");
      expect(body[1].shortCode).toBe("oldone");
    });

    it("reflects click counts accurately from the DB", async () => {
      await seedUrl("https://popular.com", "pop123", 42);

      const res = await fetchUrls();
      const body = await res.json();

      expect(body[0].clicks).toBe(42);
    });

    it("builds shortUrl using NEXT_PUBLIC_BASE_URL from environment", async () => {
      await seedUrl("https://example.com", "mycode");

      const res = await fetchUrls();
      const body = await res.json();

      // shortUrl must be constructed from the env var, not hardcoded
      expect(body[0].shortUrl).toBe(
        `${process.env.NEXT_PUBLIC_BASE_URL}/mycode`,
      );
    });
  });
});
