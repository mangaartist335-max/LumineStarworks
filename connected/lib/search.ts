// The Connected Era search engine's index.
//
// Every archive site contributes documents (pages, videos, images). The
// index is an inverted index with BM25 ranking over title, description and
// body, filtered to documents that existed at the computer's current time.

export type DocKind = "web" | "video" | "image";

export interface SearchDoc {
  id: string;
  url: string;
  title: string;
  description: string;
  body?: string;
  kind: DocKind;
  /** Thumbnail or the image itself, for image and video results. */
  image?: string;
  publishedAt: string;
  /** Display name of the site ("MeTube"). */
  site: string;
  tags?: string[];
}

export interface Snippet {
  text: string;
  hit: boolean;
}

export interface SearchHit {
  doc: SearchDoc;
  score: number;
  snippet: Snippet[];
}

export interface SearchOptions {
  now: number;
  kind?: DocKind | "all";
  /** Only documents published at or after this time (date filter). */
  since?: number;
  page?: number;
  perPage?: number;
}

const STOPWORDS = new Set(
  "a an and are as at be by for from has have how i in is it its of on or that the this to was what when where who why will with you your".split(" "),
);

/** Lowercase words, light plural folding, no stopwords. */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().normalize("NFKD").match(/[a-z0-9]+/g) ?? [])
    .filter((t) => !STOPWORDS.has(t))
    .map(stem);
}

function stem(t: string): string {
  if (t.length > 4 && t.endsWith("ies")) return `${t.slice(0, -3)}y`;
  if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss") && !t.endsWith("us")) return t.slice(0, -1);
  return t;
}

const FIELDS = [
  { key: "title", weight: 3 },
  { key: "tags", weight: 2 },
  { key: "description", weight: 1.5 },
  { key: "body", weight: 1 },
] as const;

interface Posting {
  doc: number;
  tf: number; // weighted term frequency
}

export class SearchIndex {
  private docs: SearchDoc[];
  private postings = new Map<string, Posting[]>();
  private lengths: number[];
  private avgLength: number;
  private titleTerms: string[];

  constructor(docs: SearchDoc[]) {
    this.docs = docs;
    this.lengths = [];
    docs.forEach((d, i) => {
      const counts = new Map<string, number>();
      let length = 0;
      for (const f of FIELDS) {
        const value = f.key === "tags" ? (d.tags ?? []).join(" ") : (d[f.key] ?? "");
        for (const t of tokenize(value)) {
          counts.set(t, (counts.get(t) ?? 0) + f.weight);
          length += f.weight;
        }
      }
      this.lengths.push(length);
      for (const [term, tf] of counts) {
        const list = this.postings.get(term) ?? [];
        list.push({ doc: i, tf });
        this.postings.set(term, list);
      }
    });
    this.avgLength = this.lengths.reduce((a, b) => a + b, 0) / Math.max(1, docs.length);
    this.titleTerms = [...new Set(docs.map((d) => d.title))];
  }

  get size() {
    return this.docs.length;
  }

  private visible(d: SearchDoc, o: SearchOptions): boolean {
    const t = Date.parse(d.publishedAt);
    if (t > o.now) return false;
    if (o.since !== undefined && t < o.since) return false;
    if (o.kind && o.kind !== "all" && d.kind !== o.kind) return false;
    return true;
  }

  search(query: string, o: SearchOptions): { total: number; hits: SearchHit[]; page: number; pages: number } {
    const terms = [...new Set(tokenize(query))];
    const perPage = o.perPage ?? 10;
    if (terms.length === 0) return { total: 0, hits: [], page: 1, pages: 0 };
    const scores = new Map<number, { score: number; matched: number }>();
    const N = this.docs.length;
    const k1 = 1.2;
    const b = 0.75;
    for (const term of terms) {
      // Exact term, plus prefix matches for the last word ("metu" finds MeTube).
      const lists: Posting[][] = [];
      const exact = this.postings.get(term);
      if (exact) lists.push(exact);
      if (term === terms[terms.length - 1] && term.length >= 3) {
        for (const [t, list] of this.postings) if (t !== term && t.startsWith(term)) lists.push(list.map((p) => ({ ...p, tf: p.tf * 0.5 })));
      }
      const seen = new Set<number>();
      for (const list of lists) {
        const df = list.length;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        for (const p of list) {
          const len = this.lengths[p.doc];
          const s = (idf * (p.tf * (k1 + 1))) / (p.tf + k1 * (1 - b + (b * len) / this.avgLength));
          const cur = scores.get(p.doc) ?? { score: 0, matched: 0 };
          cur.score += s;
          if (!seen.has(p.doc)) {
            cur.matched += 1;
            seen.add(p.doc);
          }
          scores.set(p.doc, cur);
        }
      }
    }
    const phrase = query.trim().toLowerCase();
    const ranked = [...scores.entries()]
      .map(([i, s]) => {
        const d = this.docs[i];
        let score = s.score * (s.matched / terms.length) ** 2; // documents matching every word first
        if (phrase.length > 2 && d.title.toLowerCase().includes(phrase)) score *= 2;
        if (d.title.toLowerCase() === phrase) score *= 1.5;
        return { i, score };
      })
      .filter(({ i }) => this.visible(this.docs[i], o))
      .sort((a, b) => b.score - a.score || this.docs[a.i].title.localeCompare(this.docs[b.i].title));
    const pages = Math.ceil(ranked.length / perPage);
    const page = Math.min(Math.max(1, o.page ?? 1), Math.max(1, pages));
    const hits = ranked.slice((page - 1) * perPage, page * perPage).map(({ i, score }) => ({
      doc: this.docs[i],
      score,
      snippet: makeSnippet(this.docs[i], terms),
    }));
    return { total: ranked.length, hits, page, pages };
  }

  /** Title suggestions for the search box, from documents that exist now. */
  suggest(prefix: string, now: number, extra: string[] = [], limit = 8): string[] {
    const p = prefix.trim().toLowerCase();
    if (!p) return [];
    const out: string[] = [];
    const add = (s: string) => {
      if (out.length < limit && !out.some((o) => o.toLowerCase() === s.toLowerCase())) out.push(s);
    };
    for (const s of extra) if (s.toLowerCase().startsWith(p)) add(s);
    const live = new Set(this.docs.filter((d) => Date.parse(d.publishedAt) <= now).map((d) => d.title));
    for (const t of this.titleTerms) if (live.has(t) && t.toLowerCase().startsWith(p)) add(t);
    for (const t of this.titleTerms) if (live.has(t) && t.toLowerCase().includes(` ${p}`)) add(t);
    return out;
  }
}

/** A short excerpt with the query words marked, without any HTML. */
export function makeSnippet(doc: SearchDoc, terms: string[], max = 180): Snippet[] {
  const source = doc.description || doc.body || "";
  let text = source;
  if (doc.body && terms.length && !terms.some((t) => tokenize(doc.description).includes(t))) {
    const i = doc.body.toLowerCase().search(new RegExp(`\\b${escapeRe(terms[0])}`));
    if (i >= 0) text = (i > 40 ? "..." : "") + doc.body.slice(Math.max(0, i - 40));
  }
  if (text.length > max) text = `${text.slice(0, max).replace(/\s+\S*$/, "")} ...`;
  const parts: Snippet[] = [];
  const re = new RegExp(`\\b(${terms.map(escapeRe).join("|")})[a-z]*`, "gi");
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) parts.push({ text: text.slice(last, m.index), hit: false });
    parts.push({ text: m[0], hit: true });
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false });
  return parts.length && terms.length ? parts : [{ text, hit: false }];
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const DATE_FILTERS: { id: string; label: string; days: number | null }[] = [
  { id: "any", label: "Any time", days: null },
  { id: "d", label: "Past 24 hours", days: 1 },
  { id: "w", label: "Past week", days: 7 },
  { id: "m", label: "Past month", days: 31 },
  { id: "y", label: "Past year", days: 366 },
];
