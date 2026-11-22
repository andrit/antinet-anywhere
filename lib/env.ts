/**
 * Fail-fast environment validation for antinet-pwa.
 *
 * Every required variable is declared here and checked ONCE, at first access. A missing or
 * malformed variable fails immediately with a message naming the variable — rather than surfacing
 * later as a confusing runtime error at the point of use, which is the failure this prevents.
 *
 * This is a cross-project pattern the workbench has seen in imgscalr, propflow, and syntaxpress
 * (`fail-fast-env-validation`); it is scaffolded here so a new project starts with it rather than
 * rediscovering it.
 *
 * Add a variable: put it in the schema, and in `.env.example`. Those two must not drift.
 */
import { z } from "zod";

const EnvSchema = z.object({
  // Required. The app cannot serve meaningful requests without a database.
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),
  DB_NAME: z.string().min(1, "DB_NAME is required"),

  // Optional with sensible defaults — declare them so they are typed, not read ad hoc.
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof EnvSchema>;

/**
 * FUNCTIONAL CORE — pure. Takes a source object, returns validated config or throws.
 *
 * Separated from `env()` deliberately: it reads no globals and caches nothing, so it can be tested
 * directly with ordinary objects and no mocking of `process.env`. Needing a mock to test
 * validation logic would mean the seam was in the wrong place.
 */
export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = EnvSchema.safeParse(source);
  if (parsed.success) return parsed.data;

  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment configuration:\n${issues}\n\n` +
      `Copy .env.example to .env and fill in the values.`,
  );
}

let cached: Env | null = null;

/**
 * IMPERATIVE SHELL — reads `process.env` and caches.
 *
 * Lazy rather than validated at import time so that `next build`, which imports modules without a
 * production environment present, does not fail on variables only needed at runtime.
 */
/* v8 ignore start -- reads a global and caches; the logic it delegates to (parseEnv) is fully
   tested. Excluded explicitly rather than by lowering the threshold. */
export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
/* v8 ignore stop */
