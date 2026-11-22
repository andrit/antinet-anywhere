Create a antinet zettelkasten PWA simulator.
It can be used on computer or mobile and should be able to extend to XR, and IoT.
It can be the use anywhere antinet.

Below is some ideas to get it started.
Its not settled yet, so review and reply.

the goal here is to create the simplest, real antinet simulation possible and build from there.
I want to get something working soon so we focus on the core and perfect it, then builkd from a solid base.

three MongoDB collections (inside a single database) can accurately simulate the Antinet's three boxes, and MongoDB’s document model actually maps quite naturally to physical index cards.
While you could use three separate MongoDB databases, using three collections (main_cards, bib_cards, index_cards) inside one database is standard practice. It makes querying, indexing, and joining data with $lookup much simpler while keeping the three "boxes" logically isolated.

How the 3 Boxes Map to MongoDB Collections


1. main_cards (The Main Box)

Each document represents a single physical card, with its numeric-alpha address serving as the primary key or a unique indexed field.
• _id / address: "3200/4B" (Sorted lexicographically or via a custom sort array to mimic physical card order).
• content: The single idea written in your own words.
• links: Array of other Main card addresses (["1100/2A", "4500/1"]) to simulate manual cross-references.
• citations: Array of embedded objects pointing to the Bib collection ([{"bib_id": "kahneman_2011", "page": "85"}]).

2. bib_cards (The Bib Box)

Each document acts as a source card, keyed by a clean author-year slug or ObjectId.
• _id: "kahneman_2011"
• author_sort: "Kahneman, Daniel" (Indexed alphabetically just like A–Z dividers).
• metadata: { "title": "Thinking, Fast and Slow", "year": 2011, "publisher": "..." }
• reading_notes: Array of raw bullet points and page numbers ([{"page": 85, "note": "System 1 jumps to conclusions"}]) captured while reading.

3. index_cards (The Index Box)

Each document represents one keyword card pointing to a small set of entry points in the Main Box.
• _id / keyword: "cognitive bias" (Indexed alphabetically).
• entry_points: Array of Main card addresses (["3200/4B", "3200/9"]).

Where MongoDB Differs from Physical Boxes

• Friction vs. Speed: In a physical Antinet, limited space on a 4"x6" Index card forces you to only list 1–3 entry addresses per keyword. In MongoDB, arrays grow endlessly—meaning you have to enforce discipline in your app logic so your Index collection doesn't turn into a noisy tag cloud.
• Branching Sort Order: Physical cards naturally sit next to each other (1000/1, 1000/1A, 1000/1A1, 1000/2). In MongoDB, standard string sorting handles simple cases well, though you may want a normalized sort key if your numbering gets deeply nested (e.g., 1000/2 vs 1000/10).
• Browsing Neighboring Cards: Physical boxes let you flip forward and backward through adjacent cards effortlessly. In MongoDB, you simulate this by querying address > current_address sorted ascending with .limit(5).

Build a strict TypeScript + MongoDB simulation first and later bolting on Neo4j as a read-only graph engine is an ideal architecture.
In software engineering, this is known as a polyglot persistence (or CQRS-style) setup: MongoDB remains your single source of truth for the strict analog cards, while Neo4j acts as a downstream analytical index for graph discovery.

Phase 1: Core Features of Your Strict TS + MongoDB Simulation

By enforcing rules in your TypeScript domain layer on top of the three MongoDB collections (main_cards, bib_cards, index_cards), you get an authentic Antinet workflow with digital superpowers:
• Address Branching Engine: A TypeScript utility that validates and generates valid numeric-alpha addresses (1000/1 → 1000/1A → 1000/1A1) and computes a normalized sort key so cards always render in exact physical box order.
• Analog Constraints (Anti-Clutter Guardrails):
	• Character/word count limits per card (forcing atomic, single-idea notes).
	• A hard cap of 3–4 entry points per Index card in your TypeScript service layer, preventing your Index Box from turning into a messy tag cloud.
• Box-Flipping Navigation: Instant "Next Card / Previous Card" queries using your sort key so you can browse adjacent cards in a branch just like flipping physical cards with your thumb.
• Two-Way Provenance & Backlinks: Clicking a shorthand citation (Kahneman 2011, p. 85) opens the Bib card, while viewing a Bib card dynamically queries main_cards to show every note you ever extracted from that book.
• Full-Text Search (Emergency Escape Hatch): MongoDB text indexes let you search raw card text if you forget which keyword you filed something under in the Index Box.

Phase 2: Adding Neo4j Later for the "Enhanced Version"

You do not need to migrate away from MongoDB or rewrite your core app to add Neo4j. Because your MongoDB cards already contain structured arrays (links, citations, and entry_points), you already have all the edges a graph database needs.

How the Integration Works

1. Sync Mechanism: Whenever a card is created, updated, or deleted in MongoDB (via Mongoose middleware, a NestJS/Express service hook, or MongoDB Change Streams), you fire an async job that upserts (MERGE) the corresponding nodes and relationships in Neo4j.
2. Role Separation:
	• MongoDB handles all writes, strict card editing, and linear box browsing.
	• Neo4j handles visual exploration, graph algorithms, and serendipity queries.

New Features Neo4j Unlocks

• Interactive 2D/3D Graph Visualization: Render your entire Zettelkasten as a visual web where you can visually spot isolated "orphan" cards or dense clusters of thought.
• Hidden Link Discovery (Triadic Closure): Run Cypher queries to ask: "Show me two Main cards that both cite the same Bib card—or share the same Index keyword—but aren't directly linked to each other yet."
• Shortest Path Between Ideas: Pick two completely unrelated concepts (e.g., Stoic philosophy and MongoDB indexing) and let Neo4j trace the bridge of intermediate cards connecting them.
• Hub & Authority Detection: Use graph centrality algorithms to find which of your cards act as structural "pillars" that hold entire arguments together.



Here are the TypeScript interfaces for the three collections (MainCard, BibCard, IndexCard) along with the Antinet address parser and sort-key generator. Let me know if you see any room for improvement or potential issues. Treat them as suggestions as first, if theyre good, adopt them.

1. TypeScript Interfaces (types/antinet.ts)

typescript
// 1. MAIN BOX CARD (Permanent Notes)
export interface CitationRef {
  bibId: string;       // References BibCard._id (e.g., "kahneman_2011")
  page?: string;       // e.g., "85" or "85-87"
}

export interface MainCard {
  _id: string;         // Numeric-alpha address, e.g., "3200/4B1"
  sortKey: string;     // Normalized key for exact MongoDB lexicographical sorting
  title: string;       // Brief header summarizing the single idea
  body: string;        // Core thought in your own words (enforced atomic length)
  links: string[];     // Outgoing addresses to related MainCards (e.g., ["1100/2A"])
  citations: CitationRef[]; // Provenance pointers to the Bib Box
  createdAt: Date;
  updatedAt: Date;
}

// 2. BIB BOX CARD (Sources & Fleeting Reading Notes)
export interface ReadingNote {
  page: string;
  note: string;
  processedToMainId?: string; // Optional tracking if converted into a MainCard
}

export interface BibCard {
  _id: string;         // Slug, e.g., "kahneman_2011"
  authorSort: string;  // "Kahneman, Daniel" (Indexed for A-Z browsing)
  title: string;
  year: number;
  sourceType: 'book' | 'article' | 'video' | 'podcast' | 'other';
  publicationDetails?: string; // Publisher, URL, ISBN, etc.
  readingNotes: ReadingNote[]; // Scratchpad notes taken while consuming source
  createdAt: Date;
}

// 3. INDEX BOX CARD (Top-Down Entry Points)
export interface IndexCard {
  _id: string;         // Normalized lowercase keyword, e.g., "cognitive bias"
  displayTerm: string; // "Cognitive Bias"
  // Strict Antinet rule: Enforce max 3-4 entry points in your service layer
  entryPoints: [string, ...string[]]; // At least 1 MainCard address
  updatedAt: Date;
}
Use code with caution.

2. Antinet Address Sorting Algorithm (utils/addressSort.ts)

Standard alphabetical sorting in MongoDB breaks on Antinet addresses because "1000/10" sorts before "1000/2", and "1000/1A" needs to sit between "1000/1" and "1000/2".
The cleanest way to solve this in MongoDB is to generate a zero-padded sortKey whenever a MainCard is saved, and put a standard ascending index on sortKey.

How the Tokenization Works

1. Split the address into alternating numeric and alphabetic segments (ignoring slashes / or dashes - as structural delimiters).
2. Pad numbers with leading zeros (e.g., 2 → 000002, 10 → 000010) so 2 < 10.
3. Prefix numbers with N: and letters with A: so sub-branches (1A) always sort immediately after their parent (1) and before the next sibling (2).
typescript
/**
 * Converts an Antinet address (e.g., "3200/4B1") into a sortable string key
 * so MongoDB's standard B-tree index orders cards identically to a physical box.
 */
export function generateSortKey(address: string): string {
  const clean = address.trim().toUpperCase();

  // Validate basic Antinet format (starts with digits, followed by alphanumeric/slash branches)
  if (!/^\d+[A-Z0-9/]*$/.test(clean)) {
    throw new Error(`Invalid Antinet address format: "${address}"`);
  }

  // Split by '/' first, then tokenize into alternating digit and letter chunks
  const branches = clean.split('/');
  const encodedBranches = branches.map((branch) => {
    const tokens = branch.match(/(\d+|[A-Z]+)/g) || [];

    return tokens
      .map((token) => {
        if (/^\d+$/.test(token)) {
          // Pad numbers to 6 digits so "2" ("000002") < "10" ("000010")
          return `N${token.padStart(6, '0')}`;
        }
        // Pad letters to 4 chars (e.g., "A" -> "A___", "AA" -> "AA__")
        return `A${token.padEnd(4, '_')}`;
      })
      .join('.');
  });

  return encodedBranches.join('/');
}

/**
 * Comparator function for sorting MainCard arrays in-memory in TypeScript
 */
export function compareAddresses(addrA: string, addrB: string): number {
  const keyA = generateSortKey(addrA);
  const keyB = generateSortKey(addrB);
  return keyA.localeCompare(keyB);
}
Use code with caution.

Example Output in Physical Box Order

When you sort by sortKey in MongoDB (db.main_cards.find().sort({ sortKey: 1 })), your cards appear in this exact sequence:

Raw Address	Generated sortKey	Physical Position
1000/1	N001000/N000001	Base note
1000/1A	N001000/N000001.A____	First branch off 1000/1
1000/1A1	N001000/N000001.A____.N000001	Sub-branch off 1000/1A
1000/1B	N001000/N000001.B____	Second branch off 1000/1
1000/2	N001000/N000002	Next sibling note
1000/10	N001000/N000010	Tenth sibling note (sorts after 2)

(Note: Because N comes after . or end-of-string in ASCII, N000001 always sorts strictly before N000001.A____.)

Here are the Mongoose schemas implementing the sortKey generation hook and the 4-entry cap on IndexCard, followed by the essential features needed to ship a complete Minimum Viable Product (MVP).

1. Mongoose Schemas & Hooks (models/antinet.models.ts)

typescript
import mongoose, { Schema, Model } from 'mongoose';
import { MainCard, BibCard, IndexCard, CitationRef, ReadingNote } from '../types/antinet';
import { generateSortKey } from '../utils/addressSort';

// ==========================================
// 1. MAIN BOX SCHEMA
// ==========================================
const CitationRefSchema = new Schema<CitationRef>(
  {
    bibId: { type: String, required: true, trim: true },
    page: { type: String, trim: true },
  },
  { _id: false }
);

const MainCardSchema = new Schema<MainCard>(
  {
    _id: { type: String, required: true, trim: true, uppercase: true },
    sortKey: { type: String, index: true }, // Indexed for fast sequential box browsing
    title: { type: String, required: true, trim: true, maxlength: 120 },
    body: {
      type: String,
      required: true,
      // Analog constraint: ~600 chars mimics the physical space of a 4"x6" index card
      maxlength: [600, 'Card body exceeds 4x6 index card capacity. Split into a branched note.'],
    },
    links: [{ type: String, trim: true, uppercase: true }],
    citations: [CitationRefSchema],
  },
  {
    timestamps: true,
    collection: 'main_cards',
  }
);

// Text index for emergency full-text search fallback
MainCardSchema.index({ title: 'text', body: 'text' });

// Pre-validate hook ensures sortKey is always computed before validation/saving
MainCardSchema.pre('validate', function (next) {
  if (this._id) {
    try {
      this.sortKey = generateSortKey(this._id);
    } catch (err) {
      return next(err as Error);
    }
  }
  next();
});

// ==========================================
// 2. BIB BOX SCHEMA
// ==========================================
const ReadingNoteSchema = new Schema<ReadingNote>(
  {
    page: { type: String, required: true, trim: true },
    note: { type: String, required: true, trim: true },
    processedToMainId: { type: String, trim: true, uppercase: true },
  },
  { _id: false }
);

const BibCardSchema = new Schema<BibCard>(
  {
    _id: { type: String, required: true, trim: true, lowercase: true },
    authorSort: { type: String, required: true, trim: true, index: true }, // A-Z divider index
    title: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    sourceType: {
      type: String,
      enum: ['book', 'article', 'video', 'podcast', 'other'],
      default: 'book',
    },
    publicationDetails: { type: String, trim: true },
    readingNotes: [ReadingNoteSchema],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'bib_cards',
  }
);

// ==========================================
// 3. INDEX BOX SCHEMA
// ==========================================
const IndexCardSchema = new Schema<IndexCard>(
  {
    _id: { type: String, required: true, trim: true, lowercase: true },
    displayTerm: { type: String, required: true, trim: true },
    entryPoints: {
      type: [String],
      required: true,
      validate: [
        {
          validator: (arr: string[]) => arr.length >= 1,
          message: 'An Index Card must point to at least 1 Main Card.',
        },
        {
          validator: (arr: string[]) => arr.length <= 4,
          message:
            'Antinet discipline limit: An Index Card cannot exceed 4 entry points. Link deeper notes inside the Main Box instead.',
        },
      ],
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true },
    collection: 'index_cards',
  }
);

// Deduplicate and uppercase entryPoints before saving
IndexCardSchema.pre('validate', function (next) {
  if (Array.isArray(this.entryPoints)) {
    this.entryPoints = Array.from(
      new Set(this.entryPoints.map((addr) => addr.trim().toUpperCase()))
    ) as [string, ...string[]];
  }
  next();
});

export const MainCardModel: Model<MainCard> = mongoose.model('MainCard', MainCardSchema);
export const BibCardModel: Model<BibCard> = mongoose.model('BibCard', BibCardSchema);
export const IndexCardModel: Model<IndexCard> = mongoose.model('IndexCard', IndexCardSchema);
Use code with caution.
(Note: Because Mongoose pre('validate') hooks do not run on findOneAndUpdate(), always fetch the document with .findById(), mutate entryPoints, and call .save() when adding a keyword pointer—or set { runValidators: true } on updates.)


Essential Features for a Complete Antinet MVP

To make the app genuinely usable for daily thinking and writing—not just a CRUD form—your MVP needs six core workflows:

1. Next-Address Suggester ("Where does this card go?")

Manually figuring out whether the next available branch off 3200/4 is 3200/4C or 3200/4B1 causes friction. Build an endpoint (GET /api/main/:id/next-addresses) that inspects existing sortKey children and returns two one-click buttons:
- suggestNextAddress() helper in TypeScript that automatically calculates the next available branch or sibling address when adding a new card
• Continue Chain (Sibling): e.g., 3200/5
• Branch Deeper (Child): e.g., 3200/4C

2. Sequential "Card Flipping" Reader View

Simulate sitting at a desk with an open box. When viewing a MainCard, automatically fetch and display:
• Previous / Next Neighbor Cards (sortKey < current and sortKey > current) via keyboard shortcuts (← / →).
• Parent & Direct Children Cards so you can see the immediate branch context.

3. Bidirectional Reference Resolution

Never display dead string IDs in the UI:
• On a MainCard: Render citations as clickable badges (Kahneman, 2011, p. 85) that open a side drawer with the full BibCard, and show Incoming Backlinks (MainCardModel.find({ links: currentId })) at the bottom of the card.
• On a BibCard: Show a list of all MainCards that cite this source so you can see everything you extracted from a book.

4. The "Bib-to-Main" Extraction Workflow

Support the core analog reading loop:
1. Create a BibCard and rapidly add readingNotes (page + rough note) while reading.
2. Provide a "Promote to Main Card" button next to each readingNote that pre-fills a new MainCard modal with the bibId and page already attached, and marks processedToMainId once saved.

5. A–Z Divider Browsing for Bib & Index Boxes

Instead of an empty search bar, give the Bib and Index views an A–Z Letter Bar (A | B | C ... Z) that queries authorSort or _id starting with that letter—mimicking flipping straight to an alphabetical tab divider.

6. Referential Integrity Guardrails on Delete/Rename

Prevent broken links across your three boxes:
• Block deleting a BibCard if any MainCard still cites it (or prompt to reassign).
• If a MainCard is deleted, automatically pull its address from any IndexCard.entryPoints and MainCard.links arrays.


