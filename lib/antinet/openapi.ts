/**
 * The OpenAPI contract for the slice-1 API, GENERATED from the Zod schemas.
 *
 * Per CLAUDE.md the contract must not be hand-maintained beside the code (it would drift). The
 * request/response schemas here are derived from the same Zod schemas the routes validate against,
 * so the contract is always in step. `zod-to-json-schema` represents a `.transform` by its input
 * type, which is exactly the wire shape a client sends. Served live at GET /api/openapi.
 */
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { MainCardInputSchema, MainCardSchema } from "./main-card";
import { BibCardInputSchema, BibCardSchema } from "./bib-card";
import { IndexCardInputSchema, IndexCardSchema } from "./index-card";
import { AddReadingNoteSchema, PromoteSchema } from "./promote";
import pkg from "../../package.json";

// Response envelopes — composed from the single-source card schemas, so no field is restated.
const ErrorSchema = z.object({ error: z.string(), details: z.unknown().optional() });

const MainCardViewSchema = z.object({
  card: MainCardSchema,
  backlinks: z.array(MainCardSchema),
  children: z.array(MainCardSchema),
  prev: MainCardSchema.nullable(),
  next: MainCardSchema.nullable(),
});
const BibCardViewSchema = z.object({ card: BibCardSchema, citedBy: z.array(MainCardSchema) });
const PromoteResultSchema = z.object({ main: MainCardSchema, bib: BibCardSchema });
const IndexCardViewSchema = z.object({
  card: IndexCardSchema,
  entries: z.array(z.object({ address: z.string(), card: MainCardSchema.nullable() })),
});

const toJson = (schema: z.ZodTypeAny) =>
  zodToJsonSchema(schema, { target: "openApi3", $refStrategy: "none", effectStrategy: "input" });

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const jsonBody = (name: string) => ({ "application/json": { schema: ref(name) } });
const errorResponse = (description: string) => ({ description, content: jsonBody("Error") });

function createOp(resource: string, inputName: string, outputName: string, idWord: string) {
  return {
    summary: `Create a ${resource} card`,
    requestBody: { required: true, content: jsonBody(inputName) },
    responses: {
      "201": { description: "Created", content: jsonBody(outputName) },
      "400": errorResponse("Invalid body"),
      "409": errorResponse(`A card with that ${idWord} already exists`),
      "500": errorResponse("Server error"),
    },
  };
}

interface GetOpSpec {
  summary: string;
  param: string;
  example: string;
  viewName: string;
  notFound: string;
}

function getOp(o: GetOpSpec) {
  return {
    summary: o.summary,
    parameters: [{ name: o.param, in: "path", required: true, schema: { type: "string" }, example: o.example }],
    responses: {
      "200": { description: o.summary, content: jsonBody(o.viewName) },
      "404": errorResponse(o.notFound),
      "500": errorResponse("Server error"),
    },
  };
}

function buildPaths() {
  return {
    "/api/main": { post: createOp("Main", "MainCardInput", "MainCard", "address") },
    "/api/main/{address}": {
      get: {
        ...getOp({
          summary: "Get a Main card with its circuit context (backlinks, direct children, prev/next)",
          param: "address",
          example: "3200/4B1",
          viewName: "MainCardView",
          notFound: "Not found or not a valid address",
        }),
        description: "The address contains '/' (e.g. 3200/4B1) and is taken as the full remaining path.",
      },
    },
    "/api/bib": { post: createOp("Bib", "BibCardInput", "BibCard", "slug") },
    "/api/bib/{slug}": {
      get: getOp({
        summary: "Get a Bib card and every Main card that cites it",
        param: "slug",
        example: "kahneman_2011",
        viewName: "BibCardView",
        notFound: "Not found",
      }),
    },
    "/api/index": { post: createOp("Index", "IndexCardInput", "IndexCard", "keyword") },
    "/api/index/{keyword}": {
      get: getOp({
        summary: "Get an Index card with its entry points resolved to Main cards",
        param: "keyword",
        example: "cognitive bias",
        viewName: "IndexCardView",
        notFound: "Not found",
      }),
    },
  };
}

function buildPromotePaths() {
  const slugParam = [
    { name: "slug", in: "path", required: true, schema: { type: "string" }, example: "kahneman_2011" },
  ];
  return {
    "/api/bib/{slug}/notes": {
      post: {
        summary: "Add a reading note to a Bib card",
        parameters: slugParam,
        requestBody: { required: true, content: jsonBody("AddReadingNote") },
        responses: {
          "201": { description: "The updated Bib card", content: jsonBody("BibCard") },
          "400": errorResponse("Invalid body"),
          "404": errorResponse("Bib card not found"),
          "500": errorResponse("Server error"),
        },
      },
    },
    "/api/bib/{slug}/promote": {
      post: {
        summary: "Promote a reading note into a new Main card",
        parameters: slugParam,
        requestBody: { required: true, content: jsonBody("Promote") },
        responses: {
          "201": { description: "The new Main card and the updated Bib card", content: jsonBody("PromoteResult") },
          "400": errorResponse("Invalid body"),
          "404": errorResponse("Bib card or note not found"),
          "409": errorResponse("Address exists, or the note was already promoted"),
          "500": errorResponse("Server error"),
        },
      },
    },
  };
}

function buildComponents() {
  return {
    schemas: {
      MainCardInput: toJson(MainCardInputSchema),
      MainCard: toJson(MainCardSchema),
      MainCardView: toJson(MainCardViewSchema),
      BibCardInput: toJson(BibCardInputSchema),
      BibCard: toJson(BibCardSchema),
      BibCardView: toJson(BibCardViewSchema),
      IndexCardInput: toJson(IndexCardInputSchema),
      IndexCard: toJson(IndexCardSchema),
      IndexCardView: toJson(IndexCardViewSchema),
      AddReadingNote: toJson(AddReadingNoteSchema),
      Promote: toJson(PromoteSchema),
      PromoteResult: toJson(PromoteResultSchema),
      Error: toJson(ErrorSchema),
    },
  };
}

/** Build the OpenAPI 3.0 document from the current Zod schemas. Pure. */
export function buildOpenApiDocument() {
  return {
    openapi: "3.0.3",
    info: {
      title: "antinet-pwa API",
      version: pkg.version,
      description:
        "Slice-1 antinet circuit: create cards in the three boxes (Main, Bib, Index) and traverse " +
        "the links between them.",
    },
    paths: { ...buildPaths(), ...buildPromotePaths() },
    components: buildComponents(),
  };
}
