/**
 * Integration tests for the [shortCode] dynamic page (src/app/[shortCode]/page.tsx)
 *
 * 1. `redirect()` in Next.js throws a special error internally (NEXT_REDIRECT).
 *    We can't catch a normal return value — we catch the thrown error and inspect
 *    it to assert where the user would be redirected.
 *
 * 2. `notFound()` similarly throws (NEXT_NOT_FOUND). Same approach.
 *
 * 3. The click increment is fire-and-forget (.catch(console.error)) in the
 *    page, so we use a small wait to let it settle before asserting the DB.
 */

import ShortCodePage from "@/app/[shortCode]/page";
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

/** Build the params prop that the page receives from Next.js routing */
function makeParams(shortCode: string) {
  return { params: Promise.resolve({ shortCode }) };
}

/**
 * Next.js redirect() throws an error with digest "NEXT_REDIRECT".
 * This helper calls the page and extracts the redirect URL from that error,
 * or re-throws if it's an unexpected error.
 */
async function getRedirectUrl(shortCode: string): Promise<string> {
  try {
    await ShortCodePage(makeParams(shortCode));
    throw new Error(
      "Expected redirect() to be called but page returned normally",
    );
  } catch (err: unknown) {
    const error = err as { digest?: string; message?: string };

    if (error?.digest?.startsWith("NEXT_REDIRECT")) {
      // Format: "NEXT_REDIRECT;replace;<url>;<status>;"
      const parts = error.digest.split(";");
      return parts[2]; // index 2 is always the URL
    }
    throw err;
  }
}

/**
 * notFound() throws with digest "NEXT_NOT_FOUND".
 * Returns true if the page threw a not-found error.
 */
async function didNotFound(shortCode: string): Promise<boolean> {
  try {
    await ShortCodePage(makeParams(shortCode));
    return false;
  } catch (err: unknown) {
    const error = err as { digest?: string };
    if (error?.digest === "NEXT_HTTP_ERROR_FALLBACK;404") return true;
    throw err;
  }
}

describe("[shortCode] page — integration", () => {
  describe("valid short code", () => {
    it("redirects to the original URL", async () => {
      await prisma.url.create({
        data: {
          originalUrl: "https://example.com",
          shortCode: "abc123",
        },
      });

      const redirectUrl = await getRedirectUrl("abc123");
      expect(redirectUrl).toBe("https://example.com");
    });

    it("increments the click count in the database", async () => {
      await prisma.url.create({
        data: {
          originalUrl: "https://example.com",
          shortCode: "abc123",
          clicks: 0,
        },
      });

      await getRedirectUrl("abc123");

      // Update is awaited in the app before redirecting
      const record = await prisma.url.findUnique({
        where: { shortCode: "abc123" },
      });
      expect(record!.clicks).toBe(1);
    });

    it("increments click count on every visit", async () => {
      await prisma.url.create({
        data: {
          originalUrl: "https://example.com",
          shortCode: "abc123",
          clicks: 5,
        },
      });

      await getRedirectUrl("abc123");

      // Update is awaited in the app before redirecting
      const record = await prisma.url.findUnique({
        where: { shortCode: "abc123" },
      });
      expect(record!.clicks).toBe(6);
    });

    it("does not affect other records' click counts", async () => {
      await prisma.url.create({
        data: { originalUrl: "https://example.com", shortCode: "abc123" },
      });
      await prisma.url.create({
        data: {
          originalUrl: "https://google.com",
          shortCode: "xyz789",
          clicks: 3,
        },
      });

      await getRedirectUrl("abc123");

      const unrelated = await prisma.url.findUnique({
        where: { shortCode: "xyz789" },
      });
      expect(unrelated!.clicks).toBe(3);
    });
  });

  describe("invalid short code", () => {
    it("triggers notFound() for an unknown short code", async () => {
      const result = await didNotFound("doesnotexist");
      expect(result).toBe(true);
    });

    it("does not increment any click count when short code is missing", async () => {
      await prisma.url.create({
        data: { originalUrl: "https://example.com", shortCode: "abc123" },
      });

      await didNotFound("wrongcode");

      const record = await prisma.url.findUnique({
        where: { shortCode: "abc123" },
      });
      expect(record!.clicks).toBe(0);
    });
  });
});
