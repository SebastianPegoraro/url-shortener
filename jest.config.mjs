/**
 * Two separate projects let you run unit and integration tests independently:
 *
 *   npm test                          → runs everything
 *   npm run test:unit                 → only unit tests (fast, no DB)
 *   npm run test:integration          → only integration tests (real SQLite DB)
 */

import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const baseConfig = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

export default createJestConfig({
  ...baseConfig,
  projects: [
    // ── Unit tests ────────────────────────────────────────────────────────
    {
      ...baseConfig,
      displayName: "unit",
      testEnvironment: "jest-environment-jsdom",
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: {
              jsx: "react-jsx",
            },
          },
        ],
      },
      // Only matches files NOT inside the integration folder
      testMatch: [
        "**/__tests__/**/*.test.ts",
        "**/__tests__/**/*.test.tsx",
        "**/*.test.ts",
        "**/*.test.tsx",
        "!**/__tests__/integration/**",
      ],
    },

    // ── Integration tests ─────────────────────────────────────────────────
    {
      ...baseConfig,
      displayName: "integration",
      // node environment — integration tests don't need a browser DOM,
      // they call route handlers and Prisma directly
      testEnvironment: "node",
      testMatch: ["**/__tests__/integration/**/*.test.ts"],
      globalSetup: "<rootDir>/jest.globalSetup.integration.ts",
      globalTeardown: "<rootDir>/jest.globalTeardown.integration.ts",
      setupFilesAfterEnv: ["<rootDir>/jest.setup.integration.ts"],
      transform: {
        "^.+\\.tsx?$": [
          "ts-jest",
          {
            tsconfig: {
              jsx: "react-jsx",
            },
          },
        ],
      },
      // Redirect @/lib/prisma to test database prisma
      moduleNameMapper: {
        "^@/lib/prisma$":
          "<rootDir>/src/__tests__/integration/helpers/testDb.ts",
        ...baseConfig.moduleNameMapper,
      },
    },
  ],
});
