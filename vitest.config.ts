import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Test config for antinet-pwa.
 *
 * Coverage thresholds are GATES, not reports. They fail `npm run test:coverage` and therefore CI.
 * They start deliberately modest — high enough that untested logic cannot quietly accumulate, low
 * enough that they do not push anyone toward writing assertions against getters to hit a number.
 * Raise them as the domain layer grows; do not lower them to make a red build green.
 *
 * Coverage is measured over `lib/` — the functional core. UI and route handlers are the imperative
 * shell and are better covered by component and E2E tests than by line coverage.
 */
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.smoke.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});
