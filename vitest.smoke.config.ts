import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Separate config for the circuit smoke test. It stands up a real (in-memory) MongoDB and drives the
 * API route handlers end-to-end, so it is NOT part of `npm run verify` (which must stay fast and
 * dependency-free). Run on demand: `npx vitest run --config vitest.smoke.config.ts`.
 */
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["**/*.smoke.ts"],
    exclude: ["node_modules/**", ".next/**"],
    testTimeout: 180000, // the first run downloads the mongod binary
    hookTimeout: 180000,
  },
});
