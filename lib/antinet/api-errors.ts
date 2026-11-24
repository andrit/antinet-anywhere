/**
 * Pure mapping from a thrown error to an HTTP status + JSON body, shared by every route handler.
 *
 * Kept here (not in the handlers) so the mapping is unit-tested without spinning up routes or a
 * database: handlers stay thin shells that call this and wrap the result in a NextResponse.
 */
import { ZodError } from "zod";

export interface ApiError {
  status: number;
  body: { error: string; details?: unknown };
}

/** True for a MongoDB duplicate-key error (E11000) — a card with that id already exists. */
export function isDuplicateKeyError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === 11000
  );
}

/** Map any thrown value to a status + body. */
export function toApiError(err: unknown): ApiError {
  if (err instanceof ZodError) {
    return { status: 400, body: { error: "Validation failed", details: err.flatten() } };
  }
  if (err instanceof SyntaxError) {
    return { status: 400, body: { error: "Invalid JSON body" } };
  }
  if (isDuplicateKeyError(err)) {
    return { status: 409, body: { error: "A card with that id already exists" } };
  }
  return { status: 500, body: { error: err instanceof Error ? err.message : "Internal server error" } };
}
