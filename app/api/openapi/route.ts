/**
 * GET /api/openapi — the API contract, generated from the Zod schemas on each request/build so it
 * can never drift from the routes. Point Swagger UI / client generators at this.
 */
import { NextResponse } from "next/server";
import { buildOpenApiDocument } from "@/lib/antinet/openapi";

export function GET() {
  return NextResponse.json(buildOpenApiDocument());
}
