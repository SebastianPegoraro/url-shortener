/**
 * jest.setup.integration.ts
 *
 * Setup file for integration tests.
 * - Mocks nanoid to avoid ESM import issues
 * - moduleNameMapper in jest.config redirects @/lib/prisma to test database
 */

// Mock nanoid - tests verify API behavior, not nanoid's internals
let nanoidCounter = 0;

jest.mock("nanoid", () => {
  return {
    nanoid: jest.fn((length: number = 21) => {
      return `test_${String(++nanoidCounter).padStart(6, "0")}`;
    }),
  };
});

// Reset counter before each test within a file
beforeEach(() => {
  nanoidCounter = 0;
});
