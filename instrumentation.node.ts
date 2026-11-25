/**
 * Node-only startup work, split out of instrumentation.ts so the Edge instrumentation bundle never
 * pulls in the mongodb driver. Imported only under the `NEXT_RUNTIME === "nodejs"` guard.
 *
 * Ensures the antinet indexes exist, fire-and-forget: a missing or unreachable database at boot is
 * logged, not fatal (indexes are a performance concern — `_id` uniqueness is automatic — and
 * `createIndex` is idempotent, so a later successful start fills them in).
 */
import { db } from "@/lib/db";
import { ensureAntinetIndexes } from "@/lib/antinet/collections";

ensureAntinetIndexes(db()).catch((err: unknown) => {
  console.warn(
    "[antinet] ensureAntinetIndexes skipped at startup:",
    err instanceof Error ? err.message : err,
  );
});
