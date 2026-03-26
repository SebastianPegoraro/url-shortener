/**
 * Integration tests for POST /api/shorten
 *
 * - Prisma is NOT mocked — every call hits a real SQLite test database.
 * - nanoid is NOT mocked — real short codes are generated.
 * - Assertions cross BOTH the HTTP layer (response) AND the DB layer,
 *   confirming that what the API returns actually matches what was persisted.
 */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/shorten/route";
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

function makeRequest(body: object) {
  return new NextRequest("http://localhost:3000/api/shorten", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/shorten — integration", () => {
  describe("happy path: shortening a new URL", () => {
    it("returns 200 with the correct shape", async () => {
      const res = await POST(makeRequest({ url: "https://example.com" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toMatchObject({
        originalUrl: "https://example.com",
        shortCode: expect.any(String),
        shortUrl: expect.stringContaining("http://localhost:3000/"),
        clicks: 0,
        createdAt: expect.any(String),
      });
    });

    it("actually persists the record to the database", async () => {
      const res = await POST(makeRequest({ url: "https://example.com" }));
      const body = await res.json();

      // Cross-layer assertion: the DB must contain exactly what the API returned
      const dbRecord = await prisma.url.findUnique({
        where: { shortCode: body.shortCode },
      });

      expect(dbRecord).not.toBeNull();
      expect(dbRecord!.originalUrl).toBe("https://example.com");
      expect(dbRecord!.shortCode).toBe(body.shortCode);
      expect(dbRecord!.clicks).toBe(0);
    });

    it("auto-prepends https:// when protocol is missing", async () => {
      const res = await POST(makeRequest({ url: "example.com" }));
      const body = await res.json();

      expect(res.status).toBe(200);
      // formatUrl should have added the protocol before saving
      expect(body.originalUrl).toBe("https://example.com");

      const dbRecord = await prisma.url.findUnique({
        where: { shortCode: body.shortCode },
      });
      expect(dbRecord!.originalUrl).toBe("https://example.com");
    });

    it("generates a unique short code (not empty, reasonable length)", async () => {
      const res = await POST(makeRequest({ url: "https://example.com" }));
      const body = await res.json();

      expect(body.shortCode).toBeTruthy();
      expect(body.shortCode.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("idempotency: shortening the same URL twice", () => {
    it("returns the existing record instead of creating a duplicate", async () => {
      const first = await POST(makeRequest({ url: "https://example.com" }));
      const firstBody = await first.json();

      const second = await POST(makeRequest({ url: "https://example.com" }));
      const secondBody = await second.json();

      // Must return the same short code
      expect(secondBody.shortCode).toBe(firstBody.shortCode);

      // Must NOT have created a second DB row
      const count = await prisma.url.count({
        where: { originalUrl: "https://example.com" },
      });
      expect(count).toBe(1);
    });
  });

  describe("validation errors", () => {
    it("returns 400 when URL is missing", async () => {
      const res = await POST(makeRequest({}));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("URL is required");
    });

    it("returns 400 for an invalid URL format", async () => {
      const res = await POST(makeRequest({ url: "not-a-url" }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Invalid URL format");
    });

    it("returns 400 for unsupported protocols like ftp://", async () => {
      const res = await POST(makeRequest({ url: "ftp://example.com" }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Invalid URL format");
    });

    it("does not create any DB record when validation fails", async () => {
      await POST(makeRequest({ url: "not-a-url" }));

      const count = await prisma.url.count();
      expect(count).toBe(0);
    });
  });

  describe("short code uniqueness under collision", () => {
    it("generates different short codes for different URLs", async () => {
      const res1 = await POST(makeRequest({ url: "https://example.com" }));
      const res2 = await POST(makeRequest({ url: "https://google.com" }));

      const body1 = await res1.json();
      const body2 = await res2.json();

      expect(body1.shortCode).not.toBe(body2.shortCode);

      // Both should exist in the DB
      const count = await prisma.url.count();
      expect(count).toBe(2);
    });
  });
});
