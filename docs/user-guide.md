# antinet-pwa — User Guide

A hands-on guide to running the app, standing up MongoDB, doing the core antinet tasks, and querying
the database directly. For the *why* behind the model, see `design/` (address grammar, bounded
contexts, ubiquitous language).

---

## 1. Prerequisites

- **Node.js 18.17+** (Next.js 14 requirement) and npm.
- **MongoDB 6 or 7** — via Docker (easiest) or a local install.
- Install dependencies once: `npm install`.

---

## 2. Start MongoDB

### Option A — Docker (recommended)

```bash
docker run -d --name antinet-mongo -p 27017:27017 mongo:7
```

- Stop / start again later: `docker stop antinet-mongo` / `docker start antinet-mongo`.
- Wipe everything: `docker rm -f antinet-mongo` (then re-run the command above).

### Option B — local install

Install MongoDB Community Server and ensure `mongod` is listening on `localhost:27017`.

Either way, the app connects lazily — it won't fail at startup if Mongo is down, but API calls that
touch the database will return an error until it's reachable.

---

## 3. Configure the app

Copy the example env file and adjust if needed:

```bash
cp .env.example .env
```

`.env` (the two that matter):

```
DATABASE_URL=mongodb://localhost:27017
DB_NAME=app
```

- `DATABASE_URL` — the MongoDB connection string (no database name needed in the URL).
- `DB_NAME` — the database the app uses (this guide assumes `app`).

A missing or malformed value fails fast with a message naming the variable.

---

## 4. Run the app

```bash
npm run dev      # development, hot reload  ->  http://localhost:3000
# or
npm run build && npm start   # production build + serve
```

Confirm the stack is healthy:

```bash
curl -s http://localhost:3000/api/health
# {"status":"ok","service":"antinet-pwa","checks":{"database":{"ok":true}},...}
```

- `status: "ok"` + HTTP 200 → app and database both up.
- `status: "degraded"` + HTTP 503 → app is up but can't reach MongoDB (check step 2).

### Indexes (created automatically)

The app ensures its indexes on startup (`instrumentation.ts`), so there's no manual step. They're
performance-only — MongoDB always indexes `_id`, so duplicate addresses are rejected regardless — and
creation is non-fatal: if the database is briefly unreachable at boot it just logs a warning and tries
again next start. If you ever want to create them by hand (e.g. against a fresh cluster), in `mongosh`:

```js
use app
db.main_cards.createIndex({ sortKey: 1 })             // box order / neighbors
db.main_cards.createIndex({ title: "text", body: "text" })  // full-text search
db.bib_cards.createIndex({ authorSort: 1 })           // A–Z browsing
```

---

## 5. The model in one minute

Three "boxes", each a MongoDB collection, forming one **closed circuit**:

| Box | Collection | A card is… | Keyed by |
|---|---|---|---|
| **Main** | `main_cards` | one atomic idea (≤600 chars) at a branched **address** | the address, e.g. `3200/4B1` |
| **Bib** | `bib_cards` | a source + reading notes | a **slug**, e.g. `kahneman_2011` |
| **Index** | `index_cards` | a keyword → 1–4 **entry points** into the Main Box | the keyword, e.g. `cognitive bias` |

**Addresses**: a free-chosen **section** number (e.g. `3200`), then `/`, then a branch path that
strictly alternates number → letter → number (`3200/4B1`). A *child* goes one level deeper
(`3200/4B` → `3200/4B1`); a *sibling* increments the last token (`3200/4B` → `3200/4C`); after `Z`
letters roll over spreadsheet-style (`…4Z` → `4AA`). Full rules: `design/antinet-address-grammar.md`.

---

## 6. Doing the core tasks (in the web UI)

Open **http://localhost:3000**. One page, three panels. The workflow follows the circuit:

1. **Capture a source** — in the **Bib Box** panel, fill *Slug* (`kahneman_2011`), *Author sort*
   (`Kahneman, Daniel`), *Title*, optional *Year* and *Source type*, then **Create Bib card**.
2. **Write an atomic note** — in the **Main Box** panel, fill *Address* (`3200/4`), *Title*, *Body*.
   To cite the source, put its slug in *Cite bibId* (+ optional page). To cross-reference another
   card, list its address under *Links*. **Create Main card**.
3. **Register a way back in** — in the **Index Box** panel, fill *Keyword* (`cognitive bias`),
   *Display term*, and *Entry points* (1–4 comma-separated addresses, e.g. `3200/4`). **Create.**
4. **Navigate the circuit** — every address shown is a link:
   - **Open address / slug / keyword** with the little form in each panel.
   - On a Main card: **← / →** flip to the previous/next card in box order; click **Children**,
     **Links**, or **Backlinks** to jump; click a **Citation** to open the Bib source.
   - On a Bib card: **Cited by** lists every Main card that cites it.
   - On an Index card: each **entry point** opens its Main card (an entry marked *(missing)* points
     at a card that doesn't exist — allowed for now).

Notes & limits (by design, for now): a Main card body is capped at **600 characters** (split into a
child instead); an Index card takes **1–4 entry points**; deleting/renaming doesn't yet clean up
references (links can dangle).

---

## 7. Doing tasks via the API (curl)

Base URL `http://localhost:3000`. All bodies are JSON.

**Create a source:**

```bash
curl -s -X POST http://localhost:3000/api/bib -H 'content-type: application/json' -d '{
  "_id":"kahneman_2011","authorSort":"Kahneman, Daniel",
  "title":"Thinking, Fast and Slow","year":2011
}'
```

**Create a Main card that cites it and links to a neighbor:**

```bash
curl -s -X POST http://localhost:3000/api/main -H 'content-type: application/json' -d '{
  "_id":"3200/4A","title":"System 1","body":"Fast, automatic thinking.",
  "links":["3200/4"],"citations":[{"bibId":"kahneman_2011","page":"85"}]
}'
```

**Create an Index card:**

```bash
curl -s -X POST http://localhost:3000/api/index -H 'content-type: application/json' -d '{
  "_id":"cognitive bias","displayTerm":"Cognitive Bias","entryPoints":["3200/4A","3200/4"]
}'
```

**Traverse (GET):**

```bash
curl -s http://localhost:3000/api/main/3200/4         # card + backlinks + children + prev/next
curl -s http://localhost:3000/api/bib/kahneman_2011   # source + who cites it
curl -s "http://localhost:3000/api/index/cognitive%20bias"   # keyword + resolved entry points
```

**The full contract** (machine-readable, generated from the schemas):

```bash
curl -s http://localhost:3000/api/openapi
```

**Status codes:** `201` created · `400` invalid body (the response `details` names the fields) ·
`409` an id already exists · `404` not found · `200` on reads.

---

## 8. Querying the database directly (mongosh)

Open a shell:

```bash
mongosh "mongodb://localhost:27017/app"
# or, with the Docker container:  docker exec -it antinet-mongo mongosh app
```

A stored Main card looks like:

```js
{
  _id: "3200/4A",
  sortKey: "N003200.N000004.L000001",   // derived; drives physical box order
  title: "System 1",
  body: "Fast, automatic thinking.",
  links: ["3200/4"],
  citations: [{ bibId: "kahneman_2011", page: "85" }],
  createdAt: ISODate("..."), updatedAt: ISODate("...")
}
```

### Common queries

```js
// One card by address
db.main_cards.findOne({ _id: "3200/4A" })

// Every Main card in physical box order (what the reader walks)
db.main_cards.find().sort({ sortKey: 1 })

// Backlinks: who links TO this address
db.main_cards.find({ links: "3200/4" })

// Provenance: every Main card that cites a source
db.main_cards.find({ "citations.bibId": "kahneman_2011" })

// A source, and a keyword
db.bib_cards.findOne({ _id: "kahneman_2011" })
db.index_cards.findOne({ _id: "cognitive bias" })

// Bib box A–Z (needs the authorSort index for speed)
db.bib_cards.find().sort({ authorSort: 1 })

// Full-text search over Main cards (needs the text index)
db.main_cards.find({ $text: { $search: "automatic" } })
```

### Descendants of a card (the "children/subtree" query)

Cards are ordered by `sortKey`, not by the raw address string (so `10` sorts after `5`, and `AA`
after `Z`). To fetch everything *under* an address, use a `sortKey` range. For `3200/4`
(sortKey `N003200.N000004`):

```js
db.main_cards.find({ sortKey: { $gte: "N003200.N000004.", $lt: "N003200.N000004/" } })
             .sort({ sortKey: 1 })
```

The `.` lower bound and `/` upper bound bracket exactly that card's subtree. Computing a `sortKey` by
hand is fiddly — for anything beyond ad-hoc inspection, prefer `GET /api/main/<address>`, which
returns the direct children for you. The encoding is documented in
`design/antinet-address-grammar.md` §5.

### Resetting data

```js
db.main_cards.drop(); db.bib_cards.drop(); db.index_cards.drop()
```

---

## 9. Maintenance & verification

```bash
npm run verify   # typecheck + lint + unit tests + build (the CI gate; no database needed)
npm run smoke    # integration test: spins up an in-memory MongoDB and drives the real API end-to-end
```

`npm run smoke` needs network on first run (it downloads a MongoDB binary, cached afterwards).

---

## 10. Deployment & hosting

Running MongoDB locally is optional — the easiest path (and the lightest on your machine) is a hosted
database, which also works for local development.

### Database: MongoDB Atlas (free)

1. Create a free **M0** cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas). Skip "Load
   sample dataset" — the app creates its own database and collections on first write.
2. Add a **database user** with a strong auto-generated password and `readWrite` on your database
   (not `atlasAdmin`).
3. **Network Access:** for a Vercel (or any serverless) deployment, allow **`0.0.0.0/0`** — Vercel's
   functions have dynamic egress IPs with no fixed range to allowlist. That opens only the *network*
   layer; every connection still needs the username/password over TLS, so the credentials (kept out
   of git) are the real gate. One `0.0.0.0/0` entry also covers local dev, so you don't need a
   separate "my IP" entry (it would just go stale).
4. Copy the `mongodb+srv://…` connection string into `DATABASE_URL`, and set `DB_NAME` (e.g. `app`).
   Use the same string in your local `.env` and you never need a local `mongod`.
5. Indexes are created automatically on first startup (`instrumentation.ts`) — no manual step; see §4.

### App: Vercel (recommended) or Railway

- **Vercel** — the native home for Next.js. Import the repo, set **Environment Variables**
  (`DATABASE_URL`, `DB_NAME`, `APP_URL`), deploy. Pair it with Atlas for the database. The app is
  already serverless-friendly: the Mongo client is created lazily and cached on `globalThis`, routes
  are `force-dynamic`, and `DATABASE_URL` accepts `mongodb+srv://`.
- **Railway** — an all-in-one option (not Postgres-only): deploy the Next app **and** a MongoDB
  service from Railway's templates, then set the same environment variables.

Never commit secrets — set `DATABASE_URL` in the host's dashboard, not in the repo (`.env` is
git-ignored). `.env.example` documents which variables are needed.

---

## 11. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `/api/health` returns `degraded` (503) | MongoDB isn't reachable — start it (§2); check `DATABASE_URL`. |
| API calls 500 with a message about an env variable | `.env` missing or incomplete — see §3. |
| `409` when creating a card | That address / slug / keyword already exists — pick another or open the existing one. |
| `400` with `details` | The body failed validation (bad address, body > 600 chars, > 4 entry points, …). |
| `404` opening a Main card | Address not found, or not a valid antinet address. |
| Box order looks wrong | Indexes are auto-created at startup (§4); if the DB was unreachable at boot, restart the app. Prefer the API's ordering. |
