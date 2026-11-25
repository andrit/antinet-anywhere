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
const DeleteResultSchema = z.object({ deleted: z.string() });
const MainDeleteResultSchema = z.object({
  deleted: z.string(),
  unlinkedFrom: z.number(),
  entryPointRemovedFrom: z.array(z.string()),
  indexCardsDeleted: z.array(z.string()),
});
const SuggestResultSchema = z.object({
  anchor: z.string(),
  child: z.string(),
  sibling: z.string().nullable(),
});
const IndexCardViewSchema = z.object({
  card: IndexCardSchema,
  entries: z.array(z.object({ address: z.string(), card: MainCardSchema.nullable() })),
});

const toJson = (schema: z.ZodTypeAny) =>
  zodToJsonSchema(schema, { target: "openApi3", $refStrategy: "none", effectStrategy: "input" });

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const jsonBody = (name: string) => ({ "application/json": { schema: ref(name) } });
const jsonArray = (name: string) => ({ "application/json": { schema: { type: "array", items: ref(name) } } });
const errorResponse = (description: string) => ({ description, content: jsonBody("Error") });

function browseOp(resource: string, itemName: string, example: string) {
  return {
    summary: `Browse ${resource} cards A–Z (optional letter prefix)`,
    parameters: [{ name: "letter", in: "query", required: false, schema: { type: "string" }, example }],
    responses: {
      "200": { description: `${resource} cards, sorted`, content: jsonArray(itemName) },
      "500": errorResponse("Server error"),
    },
  };
}

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

interface DeleteOpSpec {
  summary: string;
  param: string;
  example: string;
  outputName: string;
  blockable?: boolean;
}

function deleteOp(o: DeleteOpSpec) {
  const responses: Record<string, unknown> = {
    "200": { description: "Deleted", content: jsonBody(o.outputName) },
    "404": errorResponse("Not found"),
    "500": errorResponse("Server error"),
  };
  if (o.blockable) {
    responses["409"] = errorResponse("Blocked: still referenced by other cards");
  }
  return {
    summary: o.summary,
    parameters: [{ name: o.param, in: "path", required: true, schema: { type: "string" }, example: o.example }],
    responses,
  };
}

function buildMainPaths() {
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
      delete: deleteOp({
        summary: "Delete a Main card (cascades: heals links, cleans entry points, drops emptied Index cards)",
        param: "address",
        example: "3200/4B1",
        outputName: "MainDeleteResult",
      }),
    },
  };
}

function buildBibPaths() {
  return {
    "/api/bib": { post: createOp("Bib", "BibCardInput", "BibCard", "slug"), get: browseOp("Bib", "BibCard", "K") },
    "/api/bib/{slug}": {
      get: getOp({
        summary: "Get a Bib card and every Main card that cites it",
        param: "slug",
        example: "kahneman_2011",
        viewName: "BibCardView",
        notFound: "Not found",
      }),
      delete: deleteOp({
        summary: "Delete a Bib card (blocked if any Main card still cites it)",
        param: "slug",
        example: "kahneman_2011",
        outputName: "DeleteResult",
        blockable: true,
      }),
    },
  };
}

function buildIndexPaths() {
  return {
    "/api/index": { post: createOp("Index", "IndexCardInput", "IndexCard", "keyword"), get: browseOp("Index", "IndexCard", "C") },
    "/api/index/{keyword}": {
      get: getOp({
        summary: "Get an Index card with its entry points resolved to Main cards",
        param: "keyword",
        example: "cognitive bias",
        viewName: "IndexCardView",
        notFound: "Not found",
      }),
      delete: deleteOp({
        summary: "Delete an Index card",
        param: "keyword",
        example: "cognitive bias",
        outputName: "DeleteResult",
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

function buildSuggestPath() {
  return {
    "/api/suggest": {
      get: {
        summary: "Suggest the next free child and sibling addresses for an anchor",
        parameters: [{ name: "anchor", in: "query", required: true, schema: { type: "string" }, example: "3200/4B" }],
        responses: {
          "200": { description: "Suggested next addresses (sibling is null for a section)", content: jsonBody("SuggestResult") },
          "400": errorResponse("Invalid anchor"),
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
      DeleteResult: toJson(DeleteResultSchema),
      MainDeleteResult: toJson(MainDeleteResultSchema),
      SuggestResult: toJson(SuggestResultSchema),
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
    paths: {
      ...buildMainPaths(),
      ...buildBibPaths(),
      ...buildIndexPaths(),
      ...buildPromotePaths(),
      ...buildSuggestPath(),
    },
    components: buildComponents(),
  };
}
